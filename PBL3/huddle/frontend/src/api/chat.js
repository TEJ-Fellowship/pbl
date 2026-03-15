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

export const getUserChats = async () => {
  const res = await fetch(`${API_BASE}/api/chats`, {
    method: "GET",
    headers: authHeaders(),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to fetch chats");
  }
  return res.json();
};

export const getOrCreateChat = async (friendId) => {
  const res = await fetch(`${API_BASE}/api/chats/${friendId}/chat`, {
    method: "GET",
    headers: authHeaders(),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to get chat");
  }
  return res.json();
};

export const getChatMessages = async (chatId, page = 1) => {
  const res = await fetch(`${API_BASE}/api/chats/${chatId}/messages?page=${page}`, {
    method: "GET",
    headers: authHeaders(),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to fetch messages");
  }
  return res.json();
};

export const sendTextMessage = async (chatId, content) => {
  const res = await fetch(`${API_BASE}/api/chats/${chatId}/text`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to send message");
  }
  return res.json();
};

export const sendVoiceMessage = async (chatId, audioBlob, duration) => {
  const formData = new FormData();
  formData.append("voice", audioBlob);
  formData.append("duration", duration.toString());

  const token = getToken();

  const res = await fetch(`${API_BASE}/api/chats/${chatId}/voice`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to send voice message");
  }
  return res.json();
};

export const deleteMessage = async (messageId) => {
  const res = await fetch(`${API_BASE}/api/chats/messages/${messageId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to delete message");
  }
  return res.json();
};