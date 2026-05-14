import { useState, useEffect, useCallback } from "react";
import {
	createGroup,
	getGroup,
	suggestPayer,
	addExpense,
	getExpenses,
	getUser,
	getGroups,
	createUser,
	addPastExpense,
} from "./services/api";

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

  .header { display: flex; align-items: baseline; gap: 12px; margin-bottom: 40px; }
  .header h1 { font-size: 2rem; font-weight: 800; letter-spacing: -0.03em; }
  .header h1 span { color: var(--accent); }
  .header .sub { font-family: var(--mono); font-size: 0.75rem; color: var(--muted); }

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

  .member-row { display: flex; gap: 10px; margin-bottom: 10px; align-items: flex-start; }
  .member-row .field { flex: 1; margin-bottom: 0; }
  .member-row .btn { flex-shrink: 0; margin-top: 22px; }

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
  
  .budget-bar-wrap { background: #2a3050; height: 4px; border-radius: 2px; margin-top: 8px; overflow: hidden; }
  .budget-bar { height: 100%; background: var(--accent2); transition: width 0.3s; }
  .budget-text { font-size: 0.65rem; color: var(--muted); margin-top: 4px; text-align: right; font-family: var(--mono); }

  .pos { color: var(--green); }
  .neg { color: var(--red); }
  .zero { color: var(--muted); }

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

  .override-row { display: flex; gap: 10px; align-items: center; margin-top: 10px; }
  .override-row select { max-width: 200px; }

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

  .tabs { display: flex; gap: 4px; margin-bottom: 24px; }
  .tab {
    padding: 8px 18px; border-radius: 8px; border: 1px solid transparent;
    font-family: var(--sans); font-size: 0.85rem; font-weight: 700;
    cursor: pointer; background: none; color: var(--muted); transition: all 0.15s;
    letter-spacing: 0.02em;
  }
  .tab.active { background: var(--surface2); border-color: var(--border); color: var(--text); }

  .row { display: flex; gap: 12px; }
  .row .field { flex: 1; }

  .spinner {
    width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.2);
    border-top-color: #fff; border-radius: 50%;
    animation: spin 0.6s linear infinite; display: inline-block;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .empty { text-align: center; padding: 40px; color: var(--muted); font-family: var(--mono); font-size: 0.85rem; }

  .error { background: #2e1515; border: 1px solid var(--red); border-radius: 8px; padding: 12px 16px; font-size: 0.85rem; color: var(--red); margin-bottom: 16px; }

  .var-table { display: flex; flex-direction: column; gap: 6px; margin-top: 12px; }
  .var-row { display: flex; align-items: center; gap: 10px; font-family: var(--mono); font-size: 0.78rem; }
  .var-name { width: 100px; color: var(--text); }
  .var-bar-wrap { flex: 1; background: var(--surface2); border-radius: 4px; height: 6px; overflow: hidden; }
  .var-bar { height: 100%; border-radius: 4px; background: var(--accent); transition: width 0.4s; }
  .var-val { width: 80px; text-align: right; color: var(--muted); }
  .var-table, .suggestion .detail { display: none !important; }
  .expense-table th:last-child, .expense-table td:last-child { display: none !important; }

  .nav-header { display: flex; gap: 20px; margin-bottom: 30px; border-bottom: 1px solid var(--border); padding-bottom: 10px; margin-top: -20px; }
  .nav-item { font-family: var(--sans); font-size: 1.1rem; font-weight: 700; color: var(--muted); cursor: pointer; background: none; border: none; transition: color 0.2s; padding: 0; }
  .nav-item:hover { color: var(--text); }
  .nav-item.active { color: var(--accent); }

  .trip-list { display: flex; flex-direction: column; gap: 8px; }
  .trip-item { background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 12px 16px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
  .trip-item:hover { border-color: var(--accent); }
  .trip-item .name { font-weight: 700; font-size: 0.95rem; color: var(--text); }
  .trip-item .dest { font-family: var(--mono); font-size: 0.7rem; color: var(--muted); }
`;

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

function balanceColor(v) {
	if (v > 0.5) return "pos";
	if (v < -0.5) return "neg";
	return "zero";
}

function fmt(v) {
	return `${v >= 0 ? "+" : ""}${v.toFixed(2)}`;
}

function UserProfilerScreen() {
	const [username, setUsername] = useState("");
	const [user, setUser] = useState(null);
	const [amount, setAmount] = useState("");
	const [category, setCategory] = useState("Restaurant");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	async function handleSearch() {
		if (!username.trim()) return;
		setLoading(true);
		setError(null);
		try {
			const u = await getUser(username);
			setUser(u);
		} catch (e) {
			try {
				await createUser({ username });
				const u = await getUser(username);
				setUser(u);
			} catch (err) {
				setError(err.message);
			}
		} finally {
			setLoading(false);
		}
	}

	async function handleAdd() {
		if (!amount || parseFloat(amount) <= 0) return;
		setLoading(true);
		setError(null);
		try {
			await addPastExpense(username, { category, amount: parseFloat(amount) });
			const u = await getUser(username);
			setUser(u);
			setAmount("");
		} catch (e) {
			setError(e.message);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div>
			<div className='card'>
				<div className='card-title'>User Profile</div>
				<div
					className='row'
					style={{ alignItems: "center" }}>
					<div
						className='field'
						style={{ flex: 2, marginBottom: 0 }}>
						<label>Username</label>
						<input
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							placeholder='Enter username...'
						/>
					</div>
					<button
						className='btn btn-primary'
						onClick={handleSearch}
						disabled={loading}
						style={{ marginTop: 22 }}>
						{loading ? <span className='spinner' /> : "Load / Create"}
					</button>
				</div>
			</div>

			{error && <div className='error'>{error}</div>}

			{user && (
				<div className='card'>
					<div className='suggestion'>
						<div className='label'>Current Archetype</div>
						<div className='payer'>{user.archetype}</div>
					</div>

					<div
						className='card-title'
						style={{ marginTop: 24 }}>
						Add Past Expense
					</div>
					<div className='row'>
						<div className='field'>
							<label>Amount (USD)</label>
							<input
								type='number'
								min='0.01'
								step='0.01'
								value={amount}
								onChange={(e) => setAmount(e.target.value)}
								placeholder='0.00'
							/>
						</div>
						<div className='field'>
							<label>Category</label>
							<select
								value={category}
								onChange={(e) => setCategory(e.target.value)}>
								{CATEGORIES.map((c) => (
									<option key={c}>{c}</option>
								))}
							</select>
						</div>
					</div>
					<button
						className='btn btn-green'
						onClick={handleAdd}
						disabled={loading || !amount}>
						{loading ? <span className='spinner' /> : "Add Expense"}
					</button>
				</div>
			)}
		</div>
	);
}

function CreateGroupScreen({ onCreated }) {
	const [groupName, setGroupName] = useState("");
	const [destination, setDest] = useState("");
	const [members, setMembers] = useState([
		{ username: "", budget: 500, archetype: null, loading: false, error: null },
		{ username: "", budget: 500, archetype: null, loading: false, error: null },
	]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [existingTrips, setExistingTrips] = useState([]);

	useEffect(() => {
		getGroups().then(setExistingTrips).catch(console.error);
	}, []);

	function updateMember(i, field, val) {
		setMembers((m) =>
			m.map((x, idx) => (idx === i ? { ...x, [field]: val } : x)),
		);
	}

	async function verifyUser(i) {
		const username = members[i].username;
		if (!username) {
			updateMember(i, "archetype", null);
			updateMember(i, "error", null);
			return;
		}
		updateMember(i, "loading", true);
		updateMember(i, "error", null);
		try {
			const user = await getUser(username);
			updateMember(i, "archetype", user.archetype);
		} catch (e) {
			updateMember(i, "error", "User not found");
			updateMember(i, "archetype", null);
		} finally {
			updateMember(i, "loading", false);
		}
	}

	function addMember() {
		if (members.length < 6)
			setMembers((m) => [
				...m,
				{
					username: "",
					budget: 500,
					archetype: null,
					loading: false,
					error: null,
				},
			]);
	}

	function removeMember(i) {
		if (members.length > 2) setMembers((m) => m.filter((_, idx) => idx !== i));
	}

	async function handleCreate() {
		if (!groupName.trim()) return setError("Group name is required.");
		if (members.some((m) => !m.username.trim()))
			return setError("All members need a username.");
		if (members.some((m) => m.error))
			return setError("Some users were not found. Fix errors first.");
		if (members.some((m) => m.budget <= 0))
			return setError("Budget must be greater than zero.");

		setError(null);
		setLoading(true);
		try {
			const group = await createGroup({
				name: groupName,
				destination,
				members: members.map((m) => ({
					username: m.username,
					budget: parseFloat(m.budget),
				})),
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
			{existingTrips.length > 0 && (
				<div className='card'>
					<div className='card-title'>Recent Trips</div>
					<div className='trip-list'>
						{existingTrips.map((t) => (
							<div
								className='trip-item'
								key={t.id}
								onClick={() => onCreated(t.id)}>
								<span className='name'>{t.name}</span>
								<span className='dest'>{t.destination}</span>
							</div>
						))}
					</div>
				</div>
			)}

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
						key={i}
						style={{ flexWrap: "wrap" }}>
						<div
							className='field'
							style={{ flex: 2 }}>
							<label>Username</label>
							<input
								value={m.username}
								onChange={(e) => updateMember(i, "username", e.target.value)}
								onBlur={() => verifyUser(i)}
								placeholder={`User ${i + 1}`}
							/>
						</div>
						<div
							className='field'
							style={{ flex: 1 }}>
							<label>Budget (USD)</label>
							<input
								type='number'
								min='1'
								value={m.budget}
								onChange={(e) => updateMember(i, "budget", e.target.value)}
							/>
						</div>
						<div style={{ flexBasis: "100%", height: 0 }}></div>
						<div
							className='field'
							style={{
								display: "flex",
								alignItems: "center",
								minHeight: "30px",
							}}>
							{m.loading ? (
								<span
									className='spinner'
									style={{
										borderColor: "var(--border)",
										borderTopColor: "var(--accent)",
									}}
								/>
							) : m.error ? (
								<span
									style={{
										color: "var(--red)",
										fontSize: "0.8rem",
										fontWeight: 600,
									}}>
									✗ {m.error}
								</span>
							) : m.archetype ? (
								<span className='tag tag-cat'>Archetype: {m.archetype}</span>
							) : (
								<span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
									Type username to verify...
								</span>
							)}
						</div>
						<button
							className='btn btn-ghost btn-sm'
							onClick={() => removeMember(i)}
							disabled={members.length <= 2}
							style={{ alignSelf: "flex-start", marginTop: "22px" }}>
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
			setError(null);
		} catch (e) {
			setError("Failed to load trip data. The database might have been reset.");
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
			const s = await suggestPayer(groupId, parseFloat(amount), category);
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

	if (error && !group) {
		return (
			<div className='empty'>
				<div
					className='error'
					style={{ display: "inline-block", marginBottom: "20px" }}>
					{error}
				</div>
				<br />
				<button
					className='btn btn-ghost'
					onClick={onReset}>
					Return to Trips
				</button>
			</div>
		);
	}

	if (!group) return <div className='empty'>Loading...</div>;

	const maxVar =
		suggestion && suggestion.memberVariances
			? Math.max(...suggestion.memberVariances.map((v) => v.variance), 1)
			: 1;

	return (
		<div>
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
					← Back to Trips
				</button>
			</div>

			<div className='card'>
				<div className='card-title'>Current State & Budgets</div>
				<div className='balances'>
					{group.members.map((m) => {
						const usage = Math.min(100, (m.totalPaid / m.budget) * 100);
						return (
							<div
								className='balance-chip'
								key={m.id}>
								<div className='bname'>{m.name}</div>
								<div className='barch'>{m.archetype}</div>
								<div className={`bval ${balanceColor(m.balance)}`}>
									{fmt(m.balance)} USD
								</div>
								<div className='budget-bar-wrap'>
									<div
										className='budget-bar'
										style={{
											width: `${usage}%`,
											backgroundColor:
												usage > 90 ? "var(--red)" : "var(--accent2)",
										}}
									/>
								</div>
								<div className='budget-text'>
									Spent: {m.totalPaid.toFixed(0)} / {m.budget.toFixed(0)}
								</div>
							</div>
						);
					})}
				</div>
			</div>

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
									<span className='spinner' /> Running GA...
								</>
							) : (
								"Ask GA →"
							)}
						</button>
					</div>

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

export default function App() {
	const [view, setView] = useState("trip");
	const [groupId, setGroupId] = useState(() => {
		const saved = localStorage.getItem("activeGroupId");
		return saved ? parseInt(saved) : null;
	});

	useEffect(() => {
		if (groupId) localStorage.setItem("activeGroupId", groupId);
		else localStorage.removeItem("activeGroupId");
	}, [groupId]);

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

				<div className='nav-header'>
					<button
						className={`nav-item ${view === "trip" ? "active" : ""}`}
						onClick={() => setView("trip")}>
						Trip Manager
					</button>
					<button
						className={`nav-item ${view === "user" ? "active" : ""}`}
						onClick={() => setView("user")}>
						User Profiler
					</button>
				</div>

				{view === "user" ? (
					<UserProfilerScreen />
				) : groupId ? (
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
