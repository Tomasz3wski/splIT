"""
SplIT — Genetic Algorithm Engine (Lookahead Edition)
ga_engine.py

Instead of optimising a single payment decision, the GA plans assignments
for the CURRENT expense + K simulated future expenses. Future expenses are
sampled stochastically using archetype affinity weights, so the simulation
is behaviourally realistic even without knowing real future costs.

Chromosome
----------
  Length  : K + 1  (current expense + K future steps)
  Encoding: integer, each gene in [0, N-1] — index of the member who pays
  Gene 0  : assignment for the CURRENT (real) expense
  Gene 1…K: assignments for K simulated future expenses

Fitness
-------
  1. Simulate gene 0 against the real expense.
  2. For genes 1…K, sample a random future expense (amount + category)
     weighted by archetype affinities, then simulate the payment.
  3. fitness = -variance(final_balances)
     A small archetype-consistency bonus is added per future step where
     the assigned payer's archetype matches the category affinity.

Why this is better than greedy
-------------------------------
  Greedy picks whoever has the lowest balance right now.
  Lookahead picks whoever creates the best STARTING POINT for the next K
  decisions. For groups with Savers (who rarely pay), this matters: the GA
  learns to front-load payments from Savers on cheap items so that
  Sponsors and Retailers are not stuck covering everything later.
"""

import random
import numpy as np
import pygad

# ── Constants ─────────────────────────────────────────────────────────────────

CATEGORIES = [
    "Flight", "Hotel", "Restaurant", "Taxi",
    "Groceries", "Coffee", "Museum", "Car Rental", "Tour", "Bar",
]

# Affinity weight: how likely each archetype is to pay for this category
AFFINITY = {
    "Flight":      {"Sponsor": 0.70, "Retailer": 0.15, "Saver": 0.15},
    "Hotel":       {"Sponsor": 0.65, "Retailer": 0.20, "Saver": 0.15},
    "Restaurant":  {"Sponsor": 0.30, "Retailer": 0.50, "Saver": 0.20},
    "Taxi":        {"Sponsor": 0.20, "Retailer": 0.55, "Saver": 0.25},
    "Groceries":   {"Sponsor": 0.25, "Retailer": 0.45, "Saver": 0.30},
    "Coffee":      {"Sponsor": 0.15, "Retailer": 0.60, "Saver": 0.25},
    "Museum":      {"Sponsor": 0.35, "Retailer": 0.40, "Saver": 0.25},
    "Car Rental":  {"Sponsor": 0.60, "Retailer": 0.25, "Saver": 0.15},
    "Tour":        {"Sponsor": 0.45, "Retailer": 0.35, "Saver": 0.20},
    "Bar":         {"Sponsor": 0.25, "Retailer": 0.50, "Saver": 0.25},
}

# Typical amount ranges per category (min, mode, max) for future simulation
AMOUNT_RANGES = {
    "Flight":     (150, 400, 900),
    "Hotel":      (80,  180, 400),
    "Restaurant": (15,  50,  120),
    "Taxi":       (5,   20,  60),
    "Groceries":  (10,  35,  80),
    "Coffee":     (3,   12,  25),
    "Museum":     (8,   25,  50),
    "Car Rental": (40,  100, 200),
    "Tour":       (20,  70,  150),
    "Bar":        (10,  35,  90),
}

# How many future steps the GA simulates beyond the current expense
LOOKAHEAD_STEPS = 5

# GA hyperparameters
GA_CONFIG = {
    "num_generations":        60,
    "num_parents_mating":     8,
    "sol_per_pop":            30,
    "parent_selection_type":  "tournament",
    "K_tournament":           4,
    "crossover_type":         "single_point",
    "mutation_type":          "random",
    "mutation_percent_genes": 25,
    "keep_elitism":           3,
}

# ── Simulation helpers ────────────────────────────────────────────────────────

def _sample_future_expense():
    """Sample a random future expense using realistic distributions."""
    category = random.choice(CATEGORIES)
    lo, mode, hi = AMOUNT_RANGES[category]
    amount = float(np.random.triangular(lo, mode, hi))
    return amount, category


def _archetype_payer_weights(members, category):
    """
    Return normalised probability weights for each member paying this category,
    based purely on their archetype's affinity. Used to simulate future steps.
    """
    weights = np.array([
        AFFINITY.get(category, {}).get(m["archetype"], 1.0 / len(members))
        for m in members
    ], dtype=float)
    weights /= weights.sum()
    return weights


def _simulate_payment(balances, payer_idx, amount, n):
    """Return new balances after payer_idx covers `amount` for n people."""
    b = balances.copy()
    per_person = amount / n
    b[payer_idx] += amount - per_person
    for j in range(n):
        if j != payer_idx:
            b[j] -= per_person
    return b


def _archetype_bonus(members, payer_idx, category):
    """Small bonus when the chosen payer's archetype fits the category well."""
    archetype = members[payer_idx]["archetype"]
    weight = AFFINITY.get(category, {}).get(archetype, 0.0)
    return weight * 2.0   # scaled so it nudges but never overrides variance


# ── Core GA function ──────────────────────────────────────────────────────────

def suggest_payer(members, expense_amount, category):
    """
    Run the lookahead GA and return the suggested payer for the current expense.

    Parameters
    ----------
    members        : list of dicts — name, archetype, balance
    expense_amount : float — cost of the current expense
    category       : str   — category of the current expense

    Returns
    -------
    dict:
        payer            — member dict of the suggested payer
        payer_index      — index in members list
        fitness_history  — best fitness (as variance) per generation
        all_variances    — greedy single-step variance per candidate
                           (for comparison display in the UI)
    """
    n = len(members)
    balances = np.array([m["balance"] for m in members], dtype=float)

    # Pre-generate the SAME set of future expense scenarios for all chromosomes
    # so that fitness comparisons are fair within one GA run.
    future_expenses = [_sample_future_expense() for _ in range(LOOKAHEAD_STEPS)]

    # Pre-compute greedy single-step variances for UI display
    all_variances = []
    for i in range(n):
        b = _simulate_payment(balances, i, expense_amount, n)
        all_variances.append(float(np.var(b)))

    fitness_history = []

    def fitness_func(ga_instance, solution, solution_idx):
        # Gene 0 — current (real) expense
        current_payer = int(solution[0]) % n
        b = _simulate_payment(balances, current_payer, expense_amount, n)
        bonus = _archetype_bonus(members, current_payer, category)

        # Genes 1…K — simulated future expenses
        for step in range(LOOKAHEAD_STEPS):
            future_amount, future_category = future_expenses[step]
            future_payer = int(solution[1 + step]) % n

            # Archetype consistency bonus for this future step
            bonus += _archetype_bonus(members, future_payer, future_category) * 0.5

            b = _simulate_payment(b, future_payer, future_amount, n)

        variance = float(np.var(b))
        return -variance + bonus

    def on_generation(ga_instance):
        best_fitness = ga_instance.best_solution()[1]
        # Store as positive variance for readability in charts
        fitness_history.append(float(-best_fitness))

    gene_space = [{"low": 0, "high": n - 0.001}] * (1 + LOOKAHEAD_STEPS)

    ga = pygad.GA(
        num_genes=1 + LOOKAHEAD_STEPS,
        gene_space=gene_space,
        gene_type=float,
        fitness_func=fitness_func,
        on_generation=on_generation,
        suppress_warnings=True,
        **GA_CONFIG,
    )
    ga.run()

    best_solution, _, _ = ga.best_solution()
    payer_index = int(best_solution[0]) % n

    return {
        "payer":           members[payer_index],
        "payer_index":     payer_index,
        "fitness_history": fitness_history,
        "all_variances":   all_variances,
    }


def apply_payment(members, payer_index, expense_amount):
    """Update member balances in-place after a payment decision."""
    n = len(members)
    per_person = expense_amount / n
    for i, m in enumerate(members):
        if i == payer_index:
            m["balance"] = round(m["balance"] + expense_amount - per_person, 2)
        else:
            m["balance"] = round(m["balance"] - per_person, 2)