"""
SplIT — Synthetic Dataset Generator
Generates ~10,000 travel expense scenarios using Faker.

Output files (written to ../data/generated/):
- scenarios.csv   : one row per scenario (trip-level metadata)
- expenses.csv    : one row per expense within a scenario
- users.csv       : one row per user within a scenario
"""

import random
import uuid
from pathlib import Path

import numpy as np
import pandas as pd
from faker import Faker

# config

SEED = 42
NUM_SCENARIOS = 10_000
OUTPUT_DIR = Path(__file__).parent.parent / "data" / "generated"

random.seed(SEED)
np.random.seed(SEED)
fake = Faker()
Faker.seed(SEED)

# expense categories with realistic amount ranges

CATEGORIES = {
    "Flight":       {"min": 150,  "max": 900,  "archetype_weights": {"Sponsor": 0.70, "Retailer": 0.15, "Saver": 0.15}},
    "Hotel":        {"min": 80,   "max": 400,  "archetype_weights": {"Sponsor": 0.65, "Retailer": 0.20, "Saver": 0.15}},
    "Restaurant":   {"min": 15,   "max": 120,  "archetype_weights": {"Sponsor": 0.30, "Retailer": 0.50, "Saver": 0.20}},
    "Taxi":         {"min": 5,    "max": 60,   "archetype_weights": {"Sponsor": 0.20, "Retailer": 0.55, "Saver": 0.25}},
    "Groceries":    {"min": 10,   "max": 80,   "archetype_weights": {"Sponsor": 0.25, "Retailer": 0.45, "Saver": 0.30}},
    "Coffee":       {"min": 3,    "max": 25,   "archetype_weights": {"Sponsor": 0.15, "Retailer": 0.60, "Saver": 0.25}},
    "Museum":       {"min": 8,    "max": 50,   "archetype_weights": {"Sponsor": 0.35, "Retailer": 0.40, "Saver": 0.25}},
    "Car Rental":   {"min": 40,   "max": 200,  "archetype_weights": {"Sponsor": 0.60, "Retailer": 0.25, "Saver": 0.15}},
    "Tour":         {"min": 20,   "max": 150,  "archetype_weights": {"Sponsor": 0.45, "Retailer": 0.35, "Saver": 0.20}},
    "Bar":          {"min": 10,   "max": 90,   "archetype_weights": {"Sponsor": 0.25, "Retailer": 0.50, "Saver": 0.25}},
}

ARCHETYPES = ["Sponsor", "Retailer", "Saver"]

# Pay-prompt acceptance probability per archetype
ACCEPTANCE_PROB = {
    "Sponsor": 0.80,
    "Retailer": 0.55,
    "Saver": 0.20,
}

def sample_group_size() -> int:
    """Groups of 2–6 people, weighted toward smaller groups."""
    return random.choices([2, 3, 4, 5, 6], weights=[20, 30, 25, 15, 10])[0]


def assign_archetypes(n: int) -> list[str]:
    """Every group has at least one Sponsor and one Retailer."""
    archetypes = ["Sponsor", "Retailer"]
    archetypes += random.choices(ARCHETYPES, k=n - 2)
    random.shuffle(archetypes)
    return archetypes


def sample_amount(category: str) -> float:
    cfg = CATEGORIES[category]
    raw = np.random.triangular(cfg["min"], (cfg["min"] + cfg["max"]) / 2, cfg["max"])
    return round(float(raw), 2)


def pick_payer(users: list[dict], category: str) -> str:
    """
    Choose payer probabilistically:
    - Weight each user by their archetype's affinity for this category
    - Then accept/reject based on their acceptance probability
    - Fall back to random if all reject
    """
    weights = [
        CATEGORIES[category]["archetype_weights"][u["archetype"]]
        for u in users
    ]
    candidates = random.choices(users, weights=weights, k=len(users))
    for candidate in candidates:
        if random.random() < ACCEPTANCE_PROB[candidate["archetype"]]:
            return candidate["user_id"]
    # Fallback: whoever has the highest positive balance pays
    return max(users, key=lambda u: u["balance"])["user_id"]


# core generation

def generate_scenario() -> tuple[dict, list[dict], list[dict]]:
    scenario_id = str(uuid.uuid4())[:8]
    group_size = sample_group_size()
    num_expenses = random.randint(5, 30)
    destination = fake.city()
    trip_days = random.randint(2, 14)

    archetypes = assign_archetypes(group_size)
    users = []
    for i, arch in enumerate(archetypes):
        users.append({
            "user_id": f"{scenario_id}-U{i+1}",
            "scenario_id": scenario_id,
            "archetype": arch,
            "balance": 0.0,
        })

    user_records = []
    expense_records = []

    # Simulate expenses sequentially
    for exp_idx in range(num_expenses):
        category = random.choice(list(CATEGORIES.keys()))
        amount = sample_amount(category)
        per_person = round(amount / group_size, 2)

        payer_id = pick_payer(users, category)

        for u in users:
            if u["user_id"] == payer_id:
                u["balance"] = round(u["balance"] + amount - per_person, 2)
            else:
                u["balance"] = round(u["balance"] - per_person, 2)

        payer = next(u for u in users if u["user_id"] == payer_id)

        expense_records.append({
            "expense_id": f"{scenario_id}-E{exp_idx+1}",
            "scenario_id": scenario_id,
            "sequence":    exp_idx + 1,
            "category":    category,
            "amount":      amount,
            "payer_id":    payer_id,
            "payer_archetype": payer["archetype"],
            "current_bal_payer":   payer["balance"],
            "balance_variance":    round(float(np.var([u["balance"] for u in users])), 4),
            "group_size":          group_size,
            "next_exp_prob_high":  int(amount > 100),   # 1 if high-value expense
        })

    for u in users:
        user_records.append({
            "user_id":    u["user_id"],
            "scenario_id": scenario_id,
            "archetype":  u["archetype"],
            "final_balance": u["balance"],
        })

    scenario_record = {
        "scenario_id":   scenario_id,
        "destination":   destination,
        "trip_days":     trip_days,
        "group_size":    group_size,
        "num_expenses":  num_expenses,
        "final_balance_variance": round(float(np.var([u["balance"] for u in users])), 4),
        "archetype_mix": "-".join(sorted(archetypes)),
    }

    return scenario_record, user_records, expense_records


# entry point

def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    all_scenarios = []
    all_users = []
    all_expenses = []

    print(f"Generating {NUM_SCENARIOS:,} scenarios...")

    for i in range(NUM_SCENARIOS):
        if (i + 1) % 1000 == 0:
            print(f"  {i + 1:,} / {NUM_SCENARIOS:,}")

        scenario, users, expenses = generate_scenario()
        all_scenarios.append(scenario)
        all_users.extend(users)
        all_expenses.extend(expenses)

    scenarios_df = pd.DataFrame(all_scenarios)
    users_df     = pd.DataFrame(all_users)
    expenses_df  = pd.DataFrame(all_expenses)

    scenarios_df.to_csv(OUTPUT_DIR / "scenarios.csv", index=False)
    users_df.to_csv(OUTPUT_DIR / "users.csv", index=False)
    expenses_df.to_csv(OUTPUT_DIR / "expenses.csv", index=False)

# summary
    print("\n✓ Generation complete")
    print(f"  scenarios.csv : {len(scenarios_df):,} rows")
    print(f"  users.csv     : {len(users_df):,} rows")
    print(f"  expenses.csv  : {len(expenses_df):,} rows")
    print(f"\nArchetype distribution in users.csv:")
    print(users_df["archetype"].value_counts().to_string())
    print(f"\nAvg final balance variance per scenario: "
        f"{scenarios_df['final_balance_variance'].mean():.2f}")
    print(f"Category distribution in expenses.csv:")
    print(expenses_df["category"].value_counts().to_string())
    print(f"\nFiles written to: {OUTPUT_DIR.resolve()}")


if __name__ == "__main__":
    main()