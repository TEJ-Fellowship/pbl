import { API_URL } from "../config/env.js";
import { buildEventPlayload } from "../helper/buildEventPlayload.js";

/** Fetch all events for the current user (no date filter). */
export async function fetchEvents(signal) {
  const res = await fetch(`${API_URL}/api/events`, {
    credentials: "include",
    signal,
  });
  if (!res.ok) throw new Error("Failed to fetch events");
  return res.json();
}

export async function fetchEventsForMonth(date, signal) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const url =
    `${API_URL}/api/events?start=${startOfMonth.toISOString()}` +
    `&end=${endOfMonth.toISOString()}`;

  const res = await fetch(url, { credentials: "include", signal });
  if (!res.ok) throw new Error("Failed to fetch events");
  return res.json();
}

export async function createEvent({
  title,
  start,
  end,
  description,
  location,
}) {
  const res = await fetch(`${API_URL}/api/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(
      buildEventPlayload({ title, start, end, description, location }),
    ),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Could not create event");
  }
  return data;
}

export async function editEvent({
  eventId,
  title,
  start,
  end,
  description,
  location,
}) {
  const res = await fetch(`${API_URL}/api/events/${eventId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(
      buildEventPlayload({ title, start, end, description, location }),
    ),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Could not edit event");
  }
  return data;
}

export async function deleteEvent({ eventId }) {
  const res = await fetch(`${API_URL}/api/events/${eventId}`, {
    method: "DELETE",
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.eror || "Could not delete event");
  }
  return data;
}
