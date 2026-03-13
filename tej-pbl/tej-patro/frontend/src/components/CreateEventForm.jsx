import { useState } from "react";
import { API_URL } from "../config/env.js";

function CreateEventForm({ onClose, onSuccess }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Title is required");
      return;
    }
    if (!start || !end) {
      setError("Start and end date/time are required");
      return;
    }
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      setError("Invalid date format");
      return;
    }
    if (endDate <= startDate) {
      setError("End must be after start");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmedTitle,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          description: endDate.toISOString(),
        }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not create event");
        setSubmitting(false);
        return;
      }
      onSuccess?.();
      onClose?.();
    } catch {
      setError("Could not create event");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="event-title"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Title
        </label>
        <input
          id="event-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          placeholder="Event title"
          autoFocus
        />
      </div>

      <div>
        <label
          htmlFor="event-start"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Start
        </label>
        <input
          id="event-start"
          type="datetime-local"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>
      <div>
        <label
          htmlFor="event-end"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          End
        </label>
        <input
          id="event-end"
          type="datetime-local"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>
      <div>
        <label
          htmlFor="event-description"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Description
        </label>
        <textarea
          id="event-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 resize-y"
          placeholder="Optional description"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => onClose?.()}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {submitting ? "Creating…" : "Create"}
        </button>
      </div>
    </form>
  );
}

export default CreateEventForm;
