// Simple API utility for register and login
const API_BASE = "http://localhost:8080";

export async function registerUser(data) {
  const res = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Registration failed");
  return res.json();
}

export async function loginUser({ email, password }) {
  // Send email as username for backend compatibility
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: email, password }),
  });
  if (!res.ok) throw new Error("Login failed");
  return res.json();
}
