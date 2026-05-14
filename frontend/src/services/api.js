const BASE_URL = "http://localhost:8080/api";

export const getGroups = async () => {
	const response = await fetch(`${BASE_URL}/groups`);
	if (!response.ok) throw new Error("Failed to fetch groups");
	return response.json();
};

export const createGroup = async (groupData) => {
	const response = await fetch(`${BASE_URL}/groups`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(groupData),
	});
	if (!response.ok) throw new Error("Failed to create group");
	return response.json();
};

export const getGroup = async (id) => {
	const response = await fetch(`${BASE_URL}/groups/${id}`);
	if (!response.ok) throw new Error("Failed to fetch group");
	return response.json();
};

export const suggestPayer = async (id, amount, category) => {
	const response = await fetch(
		`${BASE_URL}/groups/${id}/suggest?amount=${amount}&category=${category}`,
	);
	if (!response.ok) throw new Error("Failed to get suggestion");
	return response.json();
};

export const addExpense = async (id, expenseData) => {
	const response = await fetch(`${BASE_URL}/groups/${id}/expenses`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(expenseData),
	});
	if (!response.ok) throw new Error("Failed to add expense");
	return response.json();
};

export const getExpenses = async (id) => {
	const response = await fetch(`${BASE_URL}/groups/${id}/expenses`);
	if (!response.ok) throw new Error("Failed to fetch expenses");
	return response.json();
};

export const createUser = async (userData) => {
	const response = await fetch(`${BASE_URL}/users`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(userData),
	});
	if (!response.ok) throw new Error("Failed to create user");
	return response.json();
};

export const addPastExpense = async (username, expenseData) => {
	const response = await fetch(`${BASE_URL}/users/${username}/expenses`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(expenseData),
	});
	if (!response.ok) throw new Error("Failed to add past expense");
	return response.json();
};

export const getUser = async (username) => {
	const response = await fetch(`${BASE_URL}/users/${username}`);
	if (!response.ok) throw new Error("User not found");
	return response.json();
};
