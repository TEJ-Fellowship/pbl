import { formatEventDate } from "../utils/date.js";

/**
 * Read-only display of a single event. Shows all fields clearly.
 * Use in a modal for "view details"; Edit button switches to edit flow.
 */
function EventDetailView({ event, onEdit, onClose }) {
  if (!event) return null;

  const hasLocation = event.location?.trim();
  const hasDescription = event.description?.trim();

  return (
    <div className="space-y-4">
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="font-medium text-slate-500">Title</dt>
          <dd className="mt-0.5 text-slate-800 text-2xl font-semibold">
            {event.title}
          </dd>
        </div>
        <div className="flex items-center gap-10">
          <div>
            <dt className="font-medium text-slate-500">Start</dt>
            <dd className="mt-0.5 text-slate-800 text-xs">
              {formatEventDate(event.start)}
            </dd>
          </div>

          <div>
            <dt className="font-medium text-slate-500">End</dt>
            <dd className="mt-0.5 text-slate-800 text-xs">
              {formatEventDate(event.end)}
            </dd>
          </div>
        </div>
        {hasLocation && (
          <div>
            <dt className="font-medium text-slate-500">Location</dt>
            <dd className="mt-0.5 text-slate-800 text-xs">{event.location}</dd>
          </div>
        )}

        {hasDescription && (
          <div>
            <dt className="font-medium text-slate-500">Notes</dt>
            <dd className="mt-0.5 text-slate-800 whitespace-pre-wrap text-lg">
              {event.description}
            </dd>
          </div>
        )}
      </dl>

      <div className="flex gap-3 pt-2 border-t border-slate-200">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Close
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="flex-1 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Edit
        </button>
      </div>
    </div>
  );
}

export default EventDetailView;
