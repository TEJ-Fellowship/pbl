import { useState } from "react";
import { createEvent, editEvent, deleteEvent } from "../api/event.js";

function toDateTimeLocal(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function CreateEventForm({
  event: initialEvent,
  onClose,
  onSuccess,
  onDelete,
}) {
  const [title, setTitle] = useState(() => initialEvent?.title ?? "");
  const [description, setDescription] = useState(
    () => initialEvent?.description ?? "",
  );
  const [location, setLocation] = useState(() => initialEvent?.location ?? "");
  const [start, setStart] = useState(() =>
    toDateTimeLocal(initialEvent?.start),
  );
  const [end, setEnd] = useState(() => toDateTimeLocal(initialEvent?.end));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isEdit = Boolean(initialEvent?._id);

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
      const locationVal = location.trim() || "";
      if (isEdit) {
        await editEvent({
          eventId: initialEvent._id,
          title: trimmedTitle,
          description: description.trim() || "",
          location: locationVal,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        });
      } else {
        await createEvent({
          title: trimmedTitle,
          description: description.trim() || "",
          location: locationVal,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        });
      }
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(
        err.message ||
          (isEdit ? "Could not update event" : "Could not create event"),
      );
      setSubmitting(false);
    }
  };
  const handleDelete = async () => {
    try {
      await deleteEvent({ evnetId: initialEvent._id });
    } catch (err) {
      setError(err.message || "Could not delete event");
    } finally {
      setSubmitting(false);
      onDelete?.();
      onClose?.();
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
          htmlFor="event-location"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Location
        </label>
        <input
          id="event-location"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          placeholder="Optional location"
        />
      </div>
      <div>
        <label
          htmlFor="event-description"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Notes
        </label>
        <textarea
          id="event-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 resize-y"
          placeholder="Optional notes..."
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <button
          type="button"
          onClick={() => onDelete?.()}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Delete
        </button>
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
            {submitting
              ? isEdit
                ? "Updating…"
                : "Creating…"
              : isEdit
                ? "Update"
                : "Create"}
          </button>
        </div>
      </div>
    </form>
  );
}

export default CreateEventForm;
