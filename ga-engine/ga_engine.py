"""
SplIT — Genetic Algorithm Engine
ga_engine.py

Given the current group state and a new expense, the GA determines which
member should pay in order to minimise balance variance across the group.

Design
------
  Chromosome : 1D array of length N (group size)
                Each gene is a float in [0, 1].
                The gene with the highest value -> that member pays.

  Fitness    : -variance(balances_after_payment) + affinity_bonus
                Negated because PyGAD maximises fitness.

  Operators  : Single-point crossover, random mutation, tournament selection.
"""

import numpy as np
import pygad

# ── Constants ─────────────────────────────────────────────────────────────────

CATEGORIES = [
    "Flight", "Hotel", "Restaurant", "Taxi",
    "Groceries", "Coffee", "Museum", "Car Rental", "Tour", "Bar",
]

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

GA_CONFIG = {
    "num_generations":        50,
    "num_parents_mating":     6,
    "sol_per_pop":            20,
    "parent_selection_type":  "tournament",
    "crossover_type":         "single_point",
    "mutation_type":          "random",
    "mutation_percent_genes": 20,
    "keep_elitism":           2,
}

# ── Core ──────────────────────────────────────────────────────────────────────

def suggest_payer(members, expense_amount, category):
    """
    Run GA and return suggested payer.

    Parameters
    ----------
    members        : list of dicts with keys: name, archetype, balance
    expense_amount : float
    category       : str — one of CATEGORIES

    Returns
    -------
    dict: payer, payer_index, fitness_history, all_variances
    """
    n = len(members)
    balances = np.array([m["balance"] for m in members], dtype=float)
    per_person = expense_amount / n

    affinities = np.array([
        AFFINITY.get(category, {}).get(m["archetype"], 1.0 / n)
        for m in members
    ], dtype=float)
    affinities /= affinities.sum()

    # Pre-compute variance for every possible payer (for reporting)
    all_variances = []
    for i in range(n):
        b = balances.copy()
        b[i] += expense_amount - per_person
        for j in range(n):
            if j != i:
                b[j] -= per_person
        all_variances.append(float(np.var(b)))

    fitness_history = []

    def fitness_func(ga_instance, solution, solution_idx):
        payer_idx = int(np.argmax(solution))
        b = balances.copy()
        b[payer_idx] += expense_amount - per_person
        for j in range(n):
            if j != payer_idx:
                b[j] -= per_person
        variance = float(np.var(b))
        affinity_bonus = float(affinities[payer_idx]) * 0.5
        return -variance + affinity_bonus

    def on_generation(ga_instance):
        best_fitness = ga_instance.best_solution()[1]
        fitness_history.append(-best_fitness)

    ga = pygad.GA(
        num_genes=n,
        gene_space={"low": 0.0, "high": 1.0},
        fitness_func=fitness_func,
        on_generation=on_generation,
        suppress_warnings=True,
        **GA_CONFIG,
    )
    ga.run()

    best_solution, _, _ = ga.best_solution()
    payer_index = int(np.argmax(best_solution))

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