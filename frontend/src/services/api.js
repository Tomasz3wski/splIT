const BASE = "http://localhost:8080/api";

export async function createGroup(payload) {
	const res = await fetch(`${BASE}/groups`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});
	if (!res.ok) throw new Error(await res.text());
	return res.json();
}

export async function getGroup(id) {
	const res = await fetch(`${BASE}/groups/${id}`);
	if (!res.ok) throw new Error(await res.text());
	return res.json();
}

export async function getSuggestion(groupId, amount, category) {
	const res = await fetch(
		`${BASE}/groups/${groupId}/suggest?amount=${amount}&category=${encodeURIComponent(category)}`,
	);
	if (!res.ok) throw new Error(await res.text());
	return res.json();
}

export async function addExpense(groupId, payload) {
	const res = await fetch(`${BASE}/groups/${groupId}/expenses`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});
	if (!res.ok) throw new Error(await res.text());
	return res.json();
}

export async function getExpenses(groupId) {
	const res = await fetch(`${BASE}/groups/${groupId}/expenses`);
	if (!res.ok) throw new Error(await res.text());
	return res.json();
}
