import Cookies from "js-cookie";
const API_BASE = "http://localhost:8080";

const getToken = () => {
  return Cookies.get("token");
};

const authHeaders = () => {
  const token = getToken();
  return {
    Authorization: `Bearer ${token}`,
  };
};

const uploadVoiceNote = async (audioBlob, title, tags, duration) => {
  const formData = new FormData();
  formData.append("file", audioBlob);
  formData.append("title", title);
  formData.append("tags", JSON.stringify(tags));
  formData.append("duration", duration.toString());

  const token = getToken();

  const res = await fetch(`${API_BASE}/api/voice-notes`, {
    method: "POST",
    headers: {
      // Authorization: `Bearer ${token}`,
      ...authHeaders(),
    },
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to upload voice note: ${errorText}`);
  }

  return res.json();
};

const getUserVoiceNotes = async () => {
  const res = await fetch(`${API_BASE}/api/voice-notes`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
  });

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || "Failed to fetch voice notes");
  }
  return res.json();
};

const getVoiceNoteById = async (noteId) => {
  const res = await fetch(`${API_BASE}/api/voice-notes/${noteId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
  });

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || "Failed to fetch voice note");
  }
  return res.json();
};

const updateVoiceNote = async (noteId, updateData) => {
  const res = await fetch(`${API_BASE}/api/voice-notes/${noteId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(updateData),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to update voice note");
  }
  return res.json();
};

const deleteVoiceNote = async (noteId) => {
  const res = await fetch(`${API_BASE}/api/voice-notes/${noteId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to delete voice note");
  }
  return res.json();
};

export {uploadVoiceNote, getUserVoiceNotes, getVoiceNoteById, updateVoiceNote, deleteVoiceNote}