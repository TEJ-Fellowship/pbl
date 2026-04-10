import { API_BASE_URL } from "../config/api";

//Send a prompt to the API and return the response
export const sendPrompt = async (message) => {
  //Input validation to ensure the message is not empty
  const cleanMessage = typeof message === "string" ? message.trim() : "";
  if (!cleanMessage) {
    const error = new Error("Message cannot be empty.");
    error.code = "INVALID_PROMPT";
    throw error;
  }

  //Send the request to the API
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: cleanMessage }),
  });

  //Parse the response
  let payload;
  try {
    payload = await response.json();
  } catch {
    const error = new Error("Server sent an invalid JSON response.");
    error.code = "INVALID_JSON_RESPONSE";
    error.status = response.status;
    throw error;
  }
  if (!response.ok || payload?.success === false) {
    const error = new Error(payload?.error?.message || "Request failed.");
    error.code = payload?.error?.code || "API_ERROR";
    error.status = response.status;
    throw error;
  }
  if (!payload?.data) {
    const error = new Error("Response data is missing.");
    error.code = "MALFORMED_SUCCESS_RESPONSE";
    error.status = response.status;
    throw error;
  }
  return payload.data; // { reply, userInput, rewrittenQuery }
};
