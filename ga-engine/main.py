"""
SplIT — Interactive Demo
main.py

Run this script to simulate a group trip in the terminal.
After each expense entry, the GA suggests who should pay.
At the end, Matplotlib charts show balance evolution and GA convergence.

Usage
-----
    python main.py
"""

import sys
import matplotlib
matplotlib.use("Agg")   # non-interactive backend for file output
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import numpy as np

from ga_engine import CATEGORIES, suggest_payer, apply_payment

# ── Colours ───────────────────────────────────────────────────────────────────

PALETTE = ["#4C72B0", "#DD8452", "#55A868", "#C44E52", "#8172B2", "#937860"]
GREEN  = "\033[92m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

# ── UI helpers ────────────────────────────────────────────────────────────────

def banner():
    print(f"\n{BOLD}{CYAN}{'─'*52}")
    print("   SplIT — AI-Powered Group Expense Splitter")
    print(f"{'─'*52}{RESET}\n")

def ask(prompt, validator=None, options=None):
    while True:
        raw = input(prompt).strip()
        if options and raw not in options:
            print(f"  Please enter one of: {', '.join(options)}")
            continue
        if validator:
            try:
                return validator(raw)
            except Exception:
                print("  Invalid input, try again.")
        else:
            if raw:
                return raw
            print("  Cannot be empty.")

def pick_from_list(label, items):
    print(f"\n{BOLD}{label}{RESET}")
    for i, item in enumerate(items, 1):
        print(f"  {i:>2}. {item}")
    while True:
        raw = input("  Your choice (number): ").strip()
        try:
            idx = int(raw) - 1
            if 0 <= idx < len(items):
                return idx, items[idx]
        except ValueError:
            pass
        print(f"  Enter a number between 1 and {len(items)}.")

def print_balances(members):
    print(f"\n{BOLD}  Current balances:{RESET}")
    for m in members:
        bar_len = int(abs(m["balance"]) / 10)
        bar = ("+" if m["balance"] >= 0 else "-") * min(bar_len, 20)
        color = GREEN if m["balance"] >= 0 else YELLOW
        print(f"    {m['name']:<12} [{m['archetype']:<8}]  "
              f"{color}{m['balance']:>+8.2f} USD  {bar}{RESET}")

# ── Setup ─────────────────────────────────────────────────────────────────────

def setup_group():
    banner()
    print("First, let's set up your group.\n")
    n = ask("  How many people? (2–6): ",
            validator=lambda x: int(x) if 2 <= int(x) <= 6 else (_ for _ in ()).throw(ValueError()))

    archetypes = ["Sponsor", "Retailer", "Saver"]
    members = []
    print()
    for i in range(int(n)):
        print(f"{BOLD}  Member {i+1}{RESET}")
        name = ask(f"    Name: ")
        _, arch = pick_from_list("    Archetype:", archetypes)
        members.append({"name": name, "archetype": arch, "balance": 0.0})
        print()

    return members

# ── Main loop ─────────────────────────────────────────────────────────────────

def run_session(members):
    expense_log   = []          # list of dicts for charting
    balance_log   = []          # snapshots of balances after each expense
    convergence_log = []        # fitness history of the last GA run

    balance_log.append([m["balance"] for m in members])

    print_balances(members)

    while True:
        print(f"\n{BOLD}{'─'*52}{RESET}")
        print("  [A] Add expense    [D] Done\n")
        cmd = ask("  Choice: ", options=["A", "a", "D", "d"]).upper()

        if cmd == "D":
            break

        # ── Collect expense details ───────────────────────────────────────────
        print()
        amount = ask("  Amount (USD): ", validator=lambda x: float(x) if float(x) > 0 else (_ for _ in ()).throw(ValueError()))
        _, category = pick_from_list("  Category:", CATEGORIES)

        # ── Run GA ───────────────────────────────────────────────────────────
        print(f"\n  {CYAN}Running GA...{RESET}", end="", flush=True)
        result = suggest_payer(members, amount, category)
        print(f" done ({len(result['fitness_history'])} generations)")

        payer   = result["payer"]
        p_idx   = result["payer_index"]
        convergence_log = result["fitness_history"]

        # ── Show suggestion ───────────────────────────────────────────────────
        print(f"\n  {BOLD}{GREEN}Suggested payer: {payer['name']} "
              f"[{payer['archetype']}]{RESET}")
        print(f"  Expense: {amount:.2f} USD — {category}")
        print(f"  Each person's share: {amount / len(members):.2f} USD\n")

        print(f"  {BOLD}Balance variance if each person pays:{RESET}")
        sorted_v = sorted(enumerate(result["all_variances"]), key=lambda x: x[1])
        for rank, (i, var) in enumerate(sorted_v):
            marker = f"  {GREEN}◀ GA choice{RESET}" if i == p_idx else ""
            print(f"    {members[i]['name']:<12}  variance={var:>10.2f}{marker}")

        # ── Confirm payment ───────────────────────────────────────────────────
        print()
        confirm = ask(f"  Accept suggestion? [Y/n]: ",
                      options=["Y", "y", "N", "n", ""]).upper()

        if confirm in ("N",):
            override_idx, _ = pick_from_list("  Who actually paid?",
                                             [m["name"] for m in members])
            p_idx = override_idx

        apply_payment(members, p_idx, amount)

        expense_log.append({
            "category": category,
            "amount":   amount,
            "payer":    members[p_idx]["name"],
        })
        balance_log.append([m["balance"] for m in members])

        print_balances(members)

    return expense_log, balance_log, convergence_log

# ── Charts ────────────────────────────────────────────────────────────────────

def save_charts(members, balance_log, convergence_log, expense_log):
    if len(balance_log) < 2:
        print("\n  (No expenses recorded — skipping charts.)")
        return

    fig = plt.figure(figsize=(14, 8))
    fig.patch.set_facecolor("#F7F9FC")
    gs = gridspec.GridSpec(2, 2, figure=fig, hspace=0.42, wspace=0.35)

    balance_arr = np.array(balance_log)   # shape: (n_expenses+1, n_members)
    x = range(len(balance_log))
    labels = [m["name"] for m in members]

    # ── Chart 1: Balance evolution ────────────────────────────────────────────
    ax1 = fig.add_subplot(gs[0, :])
    ax1.set_facecolor("#FFFFFF")
    for i, label in enumerate(labels):
        ax1.plot(x, balance_arr[:, i], marker="o", markersize=4,
                 color=PALETTE[i % len(PALETTE)], label=label, linewidth=2)
    ax1.axhline(0, color="#AAAAAA", linewidth=0.8, linestyle="--")
    ax1.set_title("Balance Evolution Over Trip", fontsize=13, fontweight="bold", pad=10)
    ax1.set_xlabel("Expense #")
    ax1.set_ylabel("Balance (USD)")
    ax1.legend(loc="upper left", fontsize=9)
    ax1.grid(axis="y", alpha=0.3)

    # Annotate category names on x-axis
    if expense_log:
        cats = [e["category"][:4] for e in expense_log]
        ax1.set_xticks(range(1, len(cats) + 1))
        ax1.set_xticklabels(cats, fontsize=7, rotation=30, ha="right")

    # ── Chart 2: GA convergence (last run) ────────────────────────────────────
    ax2 = fig.add_subplot(gs[1, 0])
    ax2.set_facecolor("#FFFFFF")
    if convergence_log:
        ax2.plot(convergence_log, color="#4C72B0", linewidth=2)
        ax2.fill_between(range(len(convergence_log)), convergence_log, alpha=0.15, color="#4C72B0")
    ax2.set_title("GA Convergence (last expense)", fontsize=11, fontweight="bold")
    ax2.set_xlabel("Generation")
    ax2.set_ylabel("Balance Variance")
    ax2.grid(alpha=0.3)

    # ── Chart 3: Final balances bar chart ────────────────────────────────────
    ax3 = fig.add_subplot(gs[1, 1])
    ax3.set_facecolor("#FFFFFF")
    final = balance_arr[-1]
    colors = [PALETTE[i % len(PALETTE)] for i in range(len(labels))]
    bars = ax3.bar(labels, final, color=colors, edgecolor="white", linewidth=0.5)
    ax3.axhline(0, color="#AAAAAA", linewidth=0.8)
    ax3.set_title("Final Balances", fontsize=11, fontweight="bold")
    ax3.set_ylabel("Balance (USD)")
    for bar, val in zip(bars, final):
        ax3.text(bar.get_x() + bar.get_width() / 2,
                 val + (2 if val >= 0 else -6),
                 f"{val:+.1f}", ha="center", va="bottom", fontsize=9, fontweight="bold")
    ax3.grid(axis="y", alpha=0.3)

    out = "split_results.png"
    plt.savefig(out, dpi=150, bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close()
    print(f"\n  {GREEN}Charts saved to {out}{RESET}")

# ── Entry point ───────────────────────────────────────────────────────────────

def main():
    try:
        members = setup_group()
        expense_log, balance_log, convergence_log = run_session(members)

        print(f"\n{BOLD}{'─'*52}")
        print("  Trip complete! Summary:")
        print(f"{'─'*52}{RESET}")
        print_balances(members)

        final_variance = np.var([m["balance"] for m in members])
        print(f"\n  Final balance variance: {final_variance:.2f}")
        if final_variance < 50:
            print(f"  {GREEN}Excellent — balances are nearly equal!{RESET}")
        elif final_variance < 500:
            print(f"  {YELLOW}Good — minor imbalances remain.{RESET}")
        else:
            print(f"  Some settling up may be needed.")

        save_charts(members, balance_log, convergence_log, expense_log)

    except KeyboardInterrupt:
        print(f"\n\n  {YELLOW}Session interrupted.{RESET}\n")
        sys.exit(0)

if __name__ == "__main__":
    main()