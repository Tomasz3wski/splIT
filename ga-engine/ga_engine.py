"""
SplIT — Genetic Algorithm Engine (Lookahead + Budget Constraints)
ga_engine.py
"""

import random
import numpy as np
import pygad

CATEGORIES = [
    "Flight", "Hotel", "Restaurant", "Taxi",
    "Groceries", "Coffee", "Museum", "Car Rental", "Tour", "Bar",
]

AFFINITY = {
    "Flight":      {"Sponsor": 0.70, "Luxury": 0.70, "Retailer": 0.15, "Foodie": 0.15, "Saver": 0.15, "Budget": 0.15},
    "Hotel":       {"Sponsor": 0.65, "Luxury": 0.65, "Retailer": 0.20, "Foodie": 0.20, "Saver": 0.15, "Budget": 0.15},
    "Restaurant":  {"Sponsor": 0.30, "Luxury": 0.30, "Retailer": 0.50, "Foodie": 0.50, "Saver": 0.20, "Budget": 0.20},
    "Taxi":        {"Sponsor": 0.20, "Luxury": 0.20, "Retailer": 0.55, "Foodie": 0.55, "Saver": 0.25, "Budget": 0.25},
    "Groceries":   {"Sponsor": 0.25, "Luxury": 0.25, "Retailer": 0.45, "Foodie": 0.45, "Saver": 0.30, "Budget": 0.30},
    "Coffee":      {"Sponsor": 0.15, "Luxury": 0.15, "Retailer": 0.60, "Foodie": 0.60, "Saver": 0.25, "Budget": 0.25},
    "Museum":      {"Sponsor": 0.35, "Luxury": 0.35, "Retailer": 0.40, "Foodie": 0.40, "Saver": 0.25, "Budget": 0.25},
    "Car Rental":  {"Sponsor": 0.60, "Luxury": 0.60, "Retailer": 0.25, "Foodie": 0.25, "Saver": 0.15, "Budget": 0.15},
    "Tour":        {"Sponsor": 0.45, "Luxury": 0.45, "Retailer": 0.35, "Foodie": 0.35, "Saver": 0.20, "Budget": 0.20},
    "Bar":         {"Sponsor": 0.25, "Luxury": 0.25, "Retailer": 0.50, "Foodie": 0.50, "Saver": 0.25, "Budget": 0.25},
}

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

LOOKAHEAD_STEPS = 5

def _simulate_payment(balances, payer_idx, amount, n):
    b = balances.copy()
    per_person = amount / n
    b[payer_idx] += amount - per_person
    for j in range(n):
        if j != payer_idx:
            b[j] -= per_person
    return b

def _archetype_bonus(members, payer_idx, category):
    archetype = members[payer_idx].get("archetype", "Standard")
    weight = AFFINITY.get(category, {}).get(archetype, 0.0)
    return weight * 2.0

def suggest_payer(members, expense_amount, category):
    n = len(members)
    balances = np.array([m.get("balance", 0.0) for m in members], dtype=float)
    budgets = np.array([m.get("budget", 999999.0) for m in members], dtype=float)
    paid_already = np.array([m.get("totalPaid", 0.0) for m in members], dtype=float)

    future_expenses = [
        (random.choice(CATEGORIES), random.triangular(*AMOUNT_RANGES[random.choice(CATEGORIES)]))
        for _ in range(LOOKAHEAD_STEPS)
    ]

    def fitness_func(ga_instance, solution, solution_idx):
        temp_balances = balances.copy()
        temp_paid = paid_already.copy()
        bonus = 0.0
        penalty = 0.0

        # Step 0: Current real expense
        payer_0 = int(solution[0]) % n
        temp_balances = _simulate_payment(temp_balances, payer_0, expense_amount, n)
        temp_paid[payer_0] += expense_amount
        bonus += _archetype_bonus(members, payer_0, category)

        # Budget Check (Current)
        if temp_paid[payer_0] > budgets[payer_0]:
            penalty += (temp_paid[payer_0] - budgets[payer_0]) * 1000

        # Lookahead steps
        for step in range(LOOKAHEAD_STEPS):
            f_cat, f_amt = future_expenses[step]
            payer_s = int(solution[1 + step]) % n
            temp_balances = _simulate_payment(temp_balances, payer_s, f_amt, n)
            temp_paid[payer_s] += f_amt
            
            if temp_paid[payer_s] > budgets[payer_s]:
                penalty += (temp_paid[payer_s] - budgets[payer_s]) * 200

        variance = float(np.var(temp_balances))
        return -variance + bonus - penalty

    ga = pygad.GA(
        num_genes=1 + LOOKAHEAD_STEPS,
        gene_space=list(range(n)),
        gene_type=int,
        fitness_func=fitness_func,
        num_generations=60,
        num_parents_mating=8,
        sol_per_pop=30,
        suppress_warnings=True
    )
    ga.run()

    best_solution, _, _ = ga.best_solution()
    payer_index = int(best_solution[0]) % n

    all_vars = []
    for i in range(n):
        b = _simulate_payment(balances, i, expense_amount, n)
        all_vars.append(float(np.var(b)))

    return {
        "payer": members[payer_index],
        "payer_index": payer_index,
        "all_variances": all_vars,
        "fitness_history": []
    }