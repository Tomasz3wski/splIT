import { useState, useEffect, useCallback } from "react";
import {
	createGroup,
	getGroup,
	getSuggestion,
	addExpense,
	getExpenses,
} from "./services/api";

// ── Design tokens ──────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #0f1117;
    --surface:   #181c27;
    --surface2:  #1e2335;
    --border:    #2a3050;
    --accent:    #5b7fff;
    --accent2:   #a78bfa;
    --green:     #34d399;
    --red:       #f87171;
    --yellow:    #fbbf24;
    --text:      #e8eaf6;
    --muted:     #6b7280;
    --radius:    12px;
    --mono:      'DM Mono', monospace;
    --sans:      'Syne', sans-serif;
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--sans);
    min-height: 100vh;
    line-height: 1.5;
  }

  .app { max-width: 960px; margin: 0 auto; padding: 32px 20px 80px; }

  /* ── Header ── */
  .header { display: flex; align-items: baseline; gap: 12px; margin-bottom: 40px; }
  .header h1 { font-size: 2rem; font-weight: 800; letter-spacing: -0.03em; }
  .header h1 span { color: var(--accent); }
  .header .sub { font-family: var(--mono); font-size: 0.75rem; color: var(--muted); }

  /* ── Cards ── */
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 24px;
    margin-bottom: 20px;
  }
  .card-title {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 16px;
  }

  /* ── Inputs ── */
  input, select {
    width: 100%;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text);
    font-family: var(--sans);
    font-size: 0.95rem;
    padding: 10px 14px;
    outline: none;
    transition: border-color 0.15s;
  }
  input:focus, select:focus { border-color: var(--accent); }
  select option { background: var(--surface2); }
  label { display: block; font-size: 0.78rem; color: var(--muted); margin-bottom: 6px; font-weight: 600; letter-spacing: 0.04em; }
  .field { margin-bottom: 14px; }

  /* ── Buttons ── */
  .btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 20px; border-radius: 8px; border: none;
    font-family: var(--sans); font-size: 0.9rem; font-weight: 700;
    cursor: pointer; transition: opacity 0.15s, transform 0.1s;
    letter-spacing: 0.02em;
  }
  .btn:hover { opacity: 0.88; }
  .btn:active { transform: scale(0.97); }
  .btn-primary { background: var(--accent); color: #fff; }
  .btn-ghost { background: var(--surface2); color: var(--text); border: 1px solid var(--border); }
  .btn-green  { background: var(--green); color: #0f1117; }
  .btn-sm { padding: 6px 14px; font-size: 0.8rem; }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* ── Member row ── */
  .member-row { display: flex; gap: 10px; margin-bottom: 10px; align-items: flex-end; }
  .member-row .field { flex: 1; margin-bottom: 0; }
  .member-row .btn { flex-shrink: 0; }

  /* ── Balance grid ── */
  .balances { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
  .balance-chip {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 14px 16px;
  }
  .balance-chip .bname { font-weight: 700; font-size: 0.95rem; margin-bottom: 2px; }
  .balance-chip .barch { font-family: var(--mono); font-size: 0.68rem; color: var(--muted); margin-bottom: 8px; }
  .balance-chip .bval { font-family: var(--mono); font-size: 1.1rem; font-weight: 500; }
  .pos { color: var(--green); }
  .neg { color: var(--red); }
  .zero { color: var(--muted); }

  /* ── Suggestion box ── */
  .suggestion {
    background: linear-gradient(135deg, #1a2240 0%, #1e2a4a 100%);
    border: 1px solid var(--accent);
    border-radius: var(--radius);
    padding: 20px 24px;
    margin-bottom: 20px;
  }
  .suggestion .label { font-size: 0.68rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent2); font-weight: 700; margin-bottom: 8px; }
  .suggestion .payer { font-size: 1.6rem; font-weight: 800; letter-spacing: -0.02em; }
  .suggestion .detail { font-family: var(--mono); font-size: 0.78rem; color: var(--muted); margin-top: 4px; }
  .suggestion .actions { display: flex; gap: 10px; margin-top: 16px; flex-wrap: wrap; }

  /* ── Override select ── */
  .override-row { display: flex; gap: 10px; align-items: center; margin-top: 10px; }
  .override-row select { max-width: 200px; }

  /* ── Expense table ── */
  .expense-table { width: 100%; border-collapse: collapse; }
  .expense-table th {
    font-size: 0.68rem; letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--muted); font-weight: 700; padding: 8px 12px; text-align: left;
    border-bottom: 1px solid var(--border);
  }
  .expense-table td { padding: 10px 12px; border-bottom: 1px solid var(--border); font-size: 0.88rem; }
  .expense-table tr:last-child td { border-bottom: none; }
  .expense-table tr:hover td { background: var(--surface2); }
  .tag {
    display: inline-block; padding: 2px 8px; border-radius: 4px;
    font-family: var(--mono); font-size: 0.7rem; font-weight: 500;
  }
  .tag-cat { background: #1e2a4a; color: var(--accent2); }
  .tag-match { background: #0d2e1f; color: var(--green); }
  .tag-override { background: #2e1515; color: var(--red); }

  /* ── Tabs ── */
  .tabs { display: flex; gap: 4px; margin-bottom: 24px; }
  .tab {
    padding: 8px 18px; border-radius: 8px; border: 1px solid transparent;
    font-family: var(--sans); font-size: 0.85rem; font-weight: 700;
    cursor: pointer; background: none; color: var(--muted); transition: all 0.15s;
    letter-spacing: 0.02em;
  }
  .tab.active { background: var(--surface2); border-color: var(--border); color: var(--text); }

  /* ── Row utils ── */
  .row { display: flex; gap: 12px; }
  .row .field { flex: 1; }

  /* ── Spinner ── */
  .spinner {
    width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.2);
    border-top-color: #fff; border-radius: 50%;
    animation: spin 0.6s linear infinite; display: inline-block;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Empty state ── */
  .empty { text-align: center; padding: 40px; color: var(--muted); font-family: var(--mono); font-size: 0.85rem; }

  /* ── Error ── */
  .error { background: #2e1515; border: 1px solid var(--red); border-radius: 8px; padding: 12px 16px; font-size: 0.85rem; color: var(--red); margin-bottom: 16px; }

  /* ── Variance table ── */
  .var-table { display: flex; flex-direction: column; gap: 6px; margin-top: 12px; }
  .var-row { display: flex; align-items: center; gap: 10px; font-family: var(--mono); font-size: 0.78rem; }
  .var-name { width: 100px; color: var(--text); }
  .var-bar-wrap { flex: 1; background: var(--surface2); border-radius: 4px; height: 6px; overflow: hidden; }
  .var-bar { height: 100%; border-radius: 4px; background: var(--accent); transition: width 0.4s; }
  .var-val { width: 80px; text-align: right; color: var(--muted); }
`;

// ── Constants ──────────────────────────────────────────────────────────────
const CATEGORIES = [
	"Flight",
	"Hotel",
	"Restaurant",
	"Taxi",
	"Groceries",
	"Coffee",
	"Museum",
	"Car Rental",
	"Tour",
	"Bar",
];
const ARCHETYPES = ["Sponsor", "Retailer", "Saver"];

// ── Helpers ────────────────────────────────────────────────────────────────
function balanceColor(v) {
	if (v > 0.5) return "pos";
	if (v < -0.5) return "neg";
	return "zero";
}
function fmt(v) {
	return `${v >= 0 ? "+" : ""}${v.toFixed(2)}`;
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN 1 — Create Group
// ══════════════════════════════════════════════════════════════════════════════
function CreateGroupScreen({ onCreated }) {
	const [groupName, setGroupName] = useState("");
	const [destination, setDest] = useState("");
	const [members, setMembers] = useState([
		{ name: "", archetype: "Sponsor" },
		{ name: "", archetype: "Retailer" },
	]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	function updateMember(i, field, val) {
		setMembers((m) =>
			m.map((x, idx) => (idx === i ? { ...x, [field]: val } : x)),
		);
	}
	function addMember() {
		if (members.length < 6)
			setMembers((m) => [...m, { name: "", archetype: "Saver" }]);
	}
	function removeMember(i) {
		if (members.length > 2) setMembers((m) => m.filter((_, idx) => idx !== i));
	}

	async function handleCreate() {
		if (!groupName.trim()) return setError("Group name is required.");
		if (members.some((m) => !m.name.trim()))
			return setError("All members need a name.");
		setError(null);
		setLoading(true);
		try {
			const group = await createGroup({
				name: groupName,
				destination,
				members,
			});
			onCreated(group.id);
		} catch (e) {
			setError(e.message);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div>
			<div className='card'>
				<div className='card-title'>Trip Details</div>
				<div className='row'>
					<div className='field'>
						<label>Group Name</label>
						<input
							value={groupName}
							onChange={(e) => setGroupName(e.target.value)}
							placeholder='e.g. Barcelona Trip'
						/>
					</div>
					<div className='field'>
						<label>Destination</label>
						<input
							value={destination}
							onChange={(e) => setDest(e.target.value)}
							placeholder='e.g. Barcelona'
						/>
					</div>
				</div>
			</div>

			<div className='card'>
				<div className='card-title'>Members ({members.length}/6)</div>
				{members.map((m, i) => (
					<div
						className='member-row'
						key={i}>
						<div className='field'>
							<label>Name</label>
							<input
								value={m.name}
								onChange={(e) => updateMember(i, "name", e.target.value)}
								placeholder={`Member ${i + 1}`}
							/>
						</div>
						<div className='field'>
							<label>Archetype</label>
							<select
								value={m.archetype}
								onChange={(e) => updateMember(i, "archetype", e.target.value)}>
								{ARCHETYPES.map((a) => (
									<option key={a}>{a}</option>
								))}
							</select>
						</div>
						<button
							className='btn btn-ghost btn-sm'
							onClick={() => removeMember(i)}
							disabled={members.length <= 2}>
							✕
						</button>
					</div>
				))}
				{members.length < 6 && (
					<button
						className='btn btn-ghost btn-sm'
						style={{ marginTop: 4 }}
						onClick={addMember}>
						+ Add Member
					</button>
				)}
			</div>

			{error && <div className='error'>{error}</div>}

			<button
				className='btn btn-primary'
				onClick={handleCreate}
				disabled={loading}>
				{loading ? <span className='spinner' /> : "Create Group →"}
			</button>
		</div>
	);
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN 2 — Trip Dashboard
// ══════════════════════════════════════════════════════════════════════════════
function DashboardScreen({ groupId, onReset }) {
	const [tab, setTab] = useState("add");
	const [group, setGroup] = useState(null);
	const [expenses, setExpenses] = useState([]);
	const [amount, setAmount] = useState("");
	const [category, setCategory] = useState("Restaurant");
	const [suggestion, setSuggestion] = useState(null);
	const [suggesting, setSuggesting] = useState(false);
	const [override, setOverride] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState(null);

	const refresh = useCallback(async () => {
		try {
			const [g, e] = await Promise.all([
				getGroup(groupId),
				getExpenses(groupId),
			]);
			setGroup(g);
			setExpenses(e);
		} catch (e) {
			setError(e.message);
		}
	}, [groupId]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	async function handleSuggest() {
		if (!amount || parseFloat(amount) <= 0)
			return setError("Enter a valid amount first.");
		setError(null);
		setSuggestion(null);
		setSuggesting(true);
		try {
			const s = await getSuggestion(groupId, parseFloat(amount), category);
			setSuggestion(s);
			setOverride(s.suggestedPayer);
		} catch (e) {
			setError(e.message);
		} finally {
			setSuggesting(false);
		}
	}

	async function handleConfirm(payerName) {
		setSubmitting(true);
		setError(null);
		try {
			await addExpense(groupId, {
				category,
				amount: parseFloat(amount),
				actualPayerName: payerName,
			});
			setSuggestion(null);
			setAmount("");
			setOverride("");
			await refresh();
			setTab("history");
		} catch (e) {
			setError(e.message);
		} finally {
			setSubmitting(false);
		}
	}

	if (!group) return <div className='empty'>Loading…</div>;

	const maxVar = suggestion
		? Math.max(...(suggestion.memberVariances || []).map((v) => v.variance), 1)
		: 1;

	return (
		<div>
			{/* Header info */}
			<div
				className='card'
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
				}}>
				<div>
					<div style={{ fontWeight: 800, fontSize: "1.2rem" }}>
						{group.name}
					</div>
					{group.destination && (
						<div
							style={{
								fontFamily: "var(--mono)",
								fontSize: "0.75rem",
								color: "var(--muted)",
								marginTop: 2,
							}}>
							{group.destination}
						</div>
					)}
				</div>
				<button
					className='btn btn-ghost btn-sm'
					onClick={onReset}>
					← New Trip
				</button>
			</div>

			{/* Balances */}
			<div className='card'>
				<div className='card-title'>Current Balances</div>
				<div className='balances'>
					{group.members.map((m) => (
						<div
							className='balance-chip'
							key={m.id}>
							<div className='bname'>{m.name}</div>
							<div className='barch'>{m.archetype}</div>
							<div className={`bval ${balanceColor(m.balance)}`}>
								{fmt(m.balance)} USD
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Tabs */}
			<div className='tabs'>
				<button
					className={`tab ${tab === "add" ? "active" : ""}`}
					onClick={() => setTab("add")}>
					Add Expense
				</button>
				<button
					className={`tab ${tab === "history" ? "active" : ""}`}
					onClick={() => {
						setTab("history");
						refresh();
					}}>
					History {expenses.length > 0 && `(${expenses.length})`}
				</button>
			</div>

			{error && <div className='error'>{error}</div>}

			{/* ── Add Expense tab ── */}
			{tab === "add" && (
				<div>
					<div className='card'>
						<div className='card-title'>New Expense</div>
						<div className='row'>
							<div className='field'>
								<label>Amount (USD)</label>
								<input
									type='number'
									min='0.01'
									step='0.01'
									value={amount}
									onChange={(e) => {
										setAmount(e.target.value);
										setSuggestion(null);
									}}
									placeholder='0.00'
								/>
							</div>
							<div className='field'>
								<label>Category</label>
								<select
									value={category}
									onChange={(e) => {
										setCategory(e.target.value);
										setSuggestion(null);
									}}>
									{CATEGORIES.map((c) => (
										<option key={c}>{c}</option>
									))}
								</select>
							</div>
						</div>
						<button
							className='btn btn-primary'
							onClick={handleSuggest}
							disabled={suggesting || !amount}>
							{suggesting ? (
								<>
									<span className='spinner' /> Running GA…
								</>
							) : (
								"Ask GA →"
							)}
						</button>
					</div>

					{/* Suggestion */}
					{suggestion && (
						<div className='suggestion'>
							<div className='label'>GA Suggestion</div>
							<div className='payer'>{suggestion.suggestedPayer}</div>
							<div className='detail'>
								{suggestion.archetype} · {parseFloat(amount).toFixed(2)} USD ·{" "}
								{category} ·{" "}
								{(parseFloat(amount) / group.members.length).toFixed(2)}{" "}
								USD/person
							</div>

							{/* Variance breakdown */}
							{suggestion.memberVariances &&
								suggestion.memberVariances.length > 0 && (
									<div className='var-table'>
										{[...suggestion.memberVariances]
											.sort((a, b) => a.variance - b.variance)
											.map((v) => (
												<div
													className='var-row'
													key={v.name}>
													<span className='var-name'>{v.name}</span>
													<div className='var-bar-wrap'>
														<div
															className='var-bar'
															style={{
																width: `${Math.round((v.variance / maxVar) * 100)}%`,
															}}
														/>
													</div>
													<span className='var-val'>
														σ²={v.variance.toFixed(0)}
													</span>
												</div>
											))}
									</div>
								)}

							<div className='actions'>
								<button
									className='btn btn-green'
									onClick={() => handleConfirm(suggestion.suggestedPayer)}
									disabled={submitting}>
									{submitting ? <span className='spinner' /> : "✓ Accept"}
								</button>

								<div className='override-row'>
									<select
										value={override}
										onChange={(e) => setOverride(e.target.value)}>
										{group.members.map((m) => (
											<option key={m.id}>{m.name}</option>
										))}
									</select>
									<button
										className='btn btn-ghost btn-sm'
										onClick={() => handleConfirm(override)}
										disabled={submitting}>
										Override
									</button>
								</div>
							</div>
						</div>
					)}
				</div>
			)}

			{/* ── History tab ── */}
			{tab === "history" && (
				<div className='card'>
					<div className='card-title'>Expense History</div>
					{expenses.length === 0 ? (
						<div className='empty'>No expenses yet.</div>
					) : (
						<table className='expense-table'>
							<thead>
								<tr>
									<th>#</th>
									<th>Category</th>
									<th>Amount</th>
									<th>Suggested</th>
									<th>Paid by</th>
									<th>Variance after</th>
								</tr>
							</thead>
							<tbody>
								{expenses.map((e, i) => {
									const matched = e.suggestedPayerName === e.actualPayerName;
									return (
										<tr key={e.id}>
											<td
												style={{
													fontFamily: "var(--mono)",
													color: "var(--muted)",
												}}>
												{i + 1}
											</td>
											<td>
												<span className='tag tag-cat'>{e.category}</span>
											</td>
											<td
												style={{ fontFamily: "var(--mono)", fontWeight: 600 }}>
												{e.amount.toFixed(2)}
											</td>
											<td
												style={{
													color: "var(--muted)",
													fontFamily: "var(--mono)",
													fontSize: "0.8rem",
												}}>
												{e.suggestedPayerName ?? "—"}
											</td>
											<td>
												<span
													className={`tag ${matched ? "tag-match" : "tag-override"}`}>
													{e.actualPayerName}
												</span>
											</td>
											<td
												style={{
													fontFamily: "var(--mono)",
													fontSize: "0.78rem",
													color: "var(--muted)",
												}}>
												σ²={e.balanceVarianceAfter?.toFixed(1)}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					)}
				</div>
			)}
		</div>
	);
}

// ══════════════════════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
	const [groupId, setGroupId] = useState(null);

	return (
		<>
			<style>{CSS}</style>
			<div className='app'>
				<div className='header'>
					<h1>
						Spl<span>IT</span>
					</h1>
					<span className='sub'>AI-powered group expenses</span>
				</div>
				{groupId ? (
					<DashboardScreen
						groupId={groupId}
						onReset={() => setGroupId(null)}
					/>
				) : (
					<CreateGroupScreen onCreated={setGroupId} />
				)}
			</div>
		</>
	);
}
