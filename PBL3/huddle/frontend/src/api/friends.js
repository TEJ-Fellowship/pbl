import Cookies from "js-cookie";

const API_BASE = "http://localhost:8080";

const getToken = () => {
  return Cookies.get("token");
};

const authHeaders = () => {
  const token = getToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

export const getAllUsers = async () => {
  const res = await fetch(`${API_BASE}/api/friends/users`, {
    method: "GET",
    headers: authHeaders(),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to fetch users");
  }
  return res.json();
};

export const sendFriendRequest = async (recipientId) => {
  const res = await fetch(`${API_BASE}/api/friends/request`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ recipientId }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to send friend request");
  }
  return res.json();
};

export const respondToFriendRequest = async (requestId, action) => {
  const res = await fetch(`${API_BASE}/api/friends/respond`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ requestId, action }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to respond to friend request");
  }
  return res.json();
};

export const getFriendRequests = async () => {
  const res = await fetch(`${API_BASE}/api/friends/requests`, {
    method: "GET",
    headers: authHeaders(),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to fetch friend requests");
  }
  return res.json();
};

export const getFriends = async () => {
  const res = await fetch(`${API_BASE}/api/friends`, {
    method: "GET",
    headers: authHeaders(),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to fetch friends");
  }
  return res.json();
};