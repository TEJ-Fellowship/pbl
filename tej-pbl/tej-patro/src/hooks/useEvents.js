import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// formatDateForAPI converts a Date to YYYY-MM-DD for the API
function formatDateForAPI(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function useEvents(user, startDate, endDate) {
  const [state, setState] = useState({ events: [], loading: false, error: null });
  const startTime = startDate?.getTime();
  const endTime = endDate?.getTime();

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    queueMicrotask(() => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
    });

    const start = startDate ? formatDateForAPI(startDate) : "";
    const end = endDate ? formatDateForAPI(endDate) : "";
    /*
    URLSearchParams - JS utility for creating and managing URL query parameters,
    query Parameters - part of a URL after ?,
    Example: /api/events?start=2026-03-01&end=2026-03-09

    set(key, value) - adds or updates a key-value pair in the URLSearchParams object(query parameters),
    toString() - converts the parameters into a string format that can be used in a URL,
    */
    const params = new URLSearchParams();
    if (start) params.set("start", start); 
    if (end) params.set("end", end);
    const qs = params.toString();
    const url = `${API_URL}/api/events${qs ? `?${qs}` : ""}`;

    fetch(url, { credentials: "include" })
      .then((res) => {
        if (!res.ok)
          throw new Error(res.status === 401 ? "Not authenticated" : `HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setState((prev) => ({ ...prev, events: Array.isArray(data) ? data : [], loading: false }));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            events: [],
            error: err.message || "Failed to load events",
            loading: false,
          }));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setState((prev) => ({ ...prev, loading: false }));
        }
      });

    return () => {
      cancelled = true;
    };
    // startTime/endTime used so effect doesn't re-run when parent passes new Date() for same range
  }, [user, startTime, endTime]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    events: user ? state.events : [],
    loading: user ? state.loading : false,
    error: user ? state.error : null,
  };
}
