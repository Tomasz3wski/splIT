"""
SplIT — GA Benchmark
benchmark.py

Compares four payer-assignment strategies on 200 randomly sampled scenarios:

  1. Random       — random member pays each expense
  2. Round-Robin  — members take turns in fixed order
  3. Greedy       — member with lowest balance pays (argmin)
  4. GA Lookahead — our Genetic Algorithm (lookahead K=5)

Metric: final balance variance across all group members at trip end.
Lower = fairer = better.

Output
------
  benchmark_results.png  — charts saved to current directory
  Summary table printed to stdout

Usage
-----
  source .venv/bin/activate
  python benchmark.py
"""

import random
import time
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec

from ga_engine import suggest_payer

# ── Config ────────────────────────────────────────────────────────────────────

SEED          = 42
NUM_SCENARIOS = 200
DATA_DIR      = "../data/generated"

random.seed(SEED)
np.random.seed(SEED)

# ── Load data ─────────────────────────────────────────────────────────────────

print("Loading dataset...")
scenarios_df = pd.read_csv(f"{DATA_DIR}/scenarios.csv")
users_df     = pd.read_csv(f"{DATA_DIR}/users.csv")
expenses_df  = pd.read_csv(f"{DATA_DIR}/expenses.csv")

# Sample evenly across group sizes
sampled = (
    pd.concat([
        g.sample(min(len(g), NUM_SCENARIOS // 5), random_state=SEED)
        for _, g in scenarios_df.groupby("group_size")
    ])
    .head(NUM_SCENARIOS)
    .reset_index(drop=True)
)
print(f"Sampled {len(sampled)} scenarios "
      f"(group sizes: {sorted(sampled['group_size'].unique())})\n")

# ── Helpers ───────────────────────────────────────────────────────────────────

def apply_payment(balances, payer_idx, amount):
    n = len(balances)
    per_person = amount / n
    b = balances.copy()
    b[payer_idx] += amount - per_person
    for j in range(n):
        if j != payer_idx:
            b[j] -= per_person
    return b


def run_scenario(expenses, members, strategy):
    balances = np.zeros(len(members))
    rr_idx   = 0

    for _, exp in expenses.iterrows():
        amount   = float(exp["amount"])
        category = str(exp["category"])
        n        = len(members)

        if strategy == "random":
            payer_idx = random.randint(0, n - 1)

        elif strategy == "roundrobin":
            payer_idx = rr_idx % n
            rr_idx   += 1

        elif strategy == "greedy":
            payer_idx = int(np.argmin(balances))

        elif strategy == "ga":
            snapshot = [
                {
                    "name":      m["name"],
                    "archetype": m["archetype"],
                    "balance":   float(balances[i]),
                }
                for i, m in enumerate(members)
            ]
            result    = suggest_payer(snapshot, amount, category)
            payer_idx = result["payer_index"]

        balances = apply_payment(balances, payer_idx, amount)

    return float(np.var(balances))


# ── Benchmark loop ────────────────────────────────────────────────────────────

strategies = ["random", "roundrobin", "greedy", "ga"]
results    = {s: [] for s in strategies}
ga_times   = []

print(f"{'#':<5} {'ScenarioID':<12} {'Members':<9} {'Expenses':<10} "
      f"{'Random':>10} {'RoundRobin':>12} {'Greedy':>10} {'GA':>10} {'Time':>8}")
print("─" * 92)

for i, (_, row) in enumerate(sampled.iterrows()):
    sid      = row["scenario_id"]
    expenses = (
        expenses_df[expenses_df["scenario_id"] == sid]
        .sort_values("sequence")
        .reset_index(drop=True)
    )
    members_rows = users_df[users_df["scenario_id"] == sid].reset_index(drop=True)

    if len(members_rows) < 2 or len(expenses) == 0:
        continue

    members = [
        {"name": f"U{j+1}", "archetype": r["archetype"], "balance": 0.0}
        for j, (_, r) in enumerate(members_rows.iterrows())
    ]

    row_v = {}
    for strategy in strategies:
        if strategy == "ga":
            t0    = time.time()
            var   = run_scenario(expenses, members, strategy)
            ga_times.append(time.time() - t0)
        else:
            var = run_scenario(expenses, members, strategy)
        row_v[strategy] = var
        results[strategy].append(var)

    print(
        f"{i+1:<5} {sid:<12} {len(members):<9} {len(expenses):<10} "
        f"{row_v['random']:>10.1f} {row_v['roundrobin']:>12.1f} "
        f"{row_v['greedy']:>10.1f} {row_v['ga']:>10.1f} "
        f"{ga_times[-1]:>7.2f}s"
    )

# ── Summary ───────────────────────────────────────────────────────────────────

print("\n" + "═" * 72)
print(f"  {'Strategy':<14} {'Mean Var':>12} {'Median Var':>12} {'Std Dev':>12} {'vs Random':>12}")
print("─" * 72)

means = {s: np.mean(results[s]) for s in strategies}
base  = means["random"]

for s in strategies:
    arr  = np.array(results[s])
    pct  = (base - means[s]) / base * 100
    best = " <- best" if s == min(means, key=means.get) else ""
    print(f"  {s:<14} {means[s]:>12.1f} {np.median(arr):>12.1f} "
          f"{np.std(arr):>12.1f} {pct:>+11.1f}%{best}")

print("═" * 72)
if ga_times:
    print(f"\n  Avg GA time per scenario: {np.mean(ga_times):.2f}s")

print("\n  GA win rate vs each strategy:")
ga_arr = np.array(results["ga"])
for s in ["random", "roundrobin", "greedy"]:
    arr  = np.array(results[s])
    wins = int(np.sum(ga_arr < arr))
    pct  = wins / len(ga_arr) * 100
    print(f"    GA beats {s:<12}: {wins}/{len(ga_arr)} ({pct:.1f}%)")

# ── Charts ────────────────────────────────────────────────────────────────────

PALETTE = {
    "random":     "#94a3b8",
    "roundrobin": "#60a5fa",
    "greedy":     "#f59e0b",
    "ga":         "#34d399",
}
LABELS = {
    "random":     "Random",
    "roundrobin": "Round-Robin",
    "greedy":     "Greedy",
    "ga":         "GA Lookahead",
}

fig = plt.figure(figsize=(16, 10))
fig.patch.set_facecolor("#0f1117")
gs  = gridspec.GridSpec(2, 2, figure=fig, hspace=0.44, wspace=0.35)

# Chart 1 — Mean variance bar chart
ax1 = fig.add_subplot(gs[0, 0])
ax1.set_facecolor("#181c27")
bars = ax1.bar(
    [LABELS[s] for s in strategies],
    [means[s] for s in strategies],
    color=[PALETTE[s] for s in strategies],
    edgecolor="#0f1117", linewidth=0.8, width=0.6,
)
for bar, s in zip(bars, strategies):
    ax1.text(
        bar.get_x() + bar.get_width() / 2,
        bar.get_height() + means["random"] * 0.012,
        f"{means[s]:.0f}",
        ha="center", va="bottom", fontsize=9,
        color="#e8eaf6", fontweight="bold",
    )
ax1.set_title("Mean Final Balance Variance", color="#e8eaf6",
              fontsize=12, fontweight="bold", pad=10)
ax1.set_ylabel("Variance (lower = fairer)", color="#e8eaf6")
ax1.tick_params(colors="#e8eaf6", labelsize=9)
ax1.spines[:].set_color("#2a3050")
ax1.grid(axis="y", alpha=0.2, color="#ffffff")

# Chart 2 — Box plot
ax2 = fig.add_subplot(gs[0, 1])
ax2.set_facecolor("#181c27")
bp = ax2.boxplot(
    [results[s] for s in strategies],
    patch_artist=True,
    medianprops=dict(color="#ffffff", linewidth=2),
    whiskerprops=dict(color="#6b7280"),
    capprops=dict(color="#6b7280"),
    flierprops=dict(marker="o", color="#6b7280", markersize=3, alpha=0.4),
)
for patch, s in zip(bp["boxes"], strategies):
    patch.set_facecolor(PALETTE[s])
    patch.set_alpha(0.85)
ax2.set_xticklabels([LABELS[s] for s in strategies], fontsize=8, color="#e8eaf6")
ax2.set_title("Variance Distribution", color="#e8eaf6",
              fontsize=12, fontweight="bold", pad=10)
ax2.set_ylabel("Variance", color="#e8eaf6")
ax2.tick_params(colors="#e8eaf6", labelsize=9)
ax2.spines[:].set_color("#2a3050")
ax2.grid(axis="y", alpha=0.2, color="#ffffff")

# Chart 3 — Per-scenario comparison
ax3 = fig.add_subplot(gs[1, :])
ax3.set_facecolor("#181c27")

greedy_arr = np.array(results["greedy"])
random_arr = np.array(results["random"])
rr_arr     = np.array(results["roundrobin"])
x          = np.arange(len(ga_arr))

ax3.fill_between(x, greedy_arr, ga_arr,
                 where=(ga_arr < greedy_arr),
                 alpha=0.2, color="#34d399", label="GA better than Greedy")
ax3.fill_between(x, greedy_arr, ga_arr,
                 where=(ga_arr >= greedy_arr),
                 alpha=0.15, color="#f87171", label="Greedy better than GA")
ax3.plot(x, random_arr, color=PALETTE["random"],     linewidth=0.8, alpha=0.6, label="Random")
ax3.plot(x, rr_arr,     color=PALETTE["roundrobin"], linewidth=0.8, alpha=0.6, label="Round-Robin")
ax3.plot(x, greedy_arr, color=PALETTE["greedy"],     linewidth=1.2, alpha=0.85, label="Greedy")
ax3.plot(x, ga_arr,     color=PALETTE["ga"],         linewidth=1.5, label="GA Lookahead")

ax3.set_title("Final Variance per Scenario — All Strategies",
              color="#e8eaf6", fontsize=12, fontweight="bold", pad=10)
ax3.set_xlabel("Scenario index", color="#e8eaf6")
ax3.set_ylabel("Variance", color="#e8eaf6")
ax3.tick_params(colors="#e8eaf6")
ax3.spines[:].set_color("#2a3050")
ax3.grid(alpha=0.15, color="#ffffff")
ax3.legend(fontsize=9, facecolor="#181c27",
           labelcolor="#e8eaf6", edgecolor="#2a3050")

plt.suptitle(
    f"SplIT — GA Benchmark  |  {len(ga_arr)} scenarios",
    color="#e8eaf6", fontsize=14, fontweight="bold", y=0.98,
)

out = "../docs/benchmark_results.png"
plt.savefig(out, dpi=150, bbox_inches="tight", facecolor=fig.get_facecolor())
plt.close()
print(f"\n  Chart saved to {out}")