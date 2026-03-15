import { PenIcon } from "lucide-react";
import { formatEventDate } from "../utils/date.js";

function EventsList({ events = [], onEditEvent, onViewEvent }) {
  return (
    <aside className="w-80 shrink-0 border-l border-slate-200 bg-white p-4 overflow-y-auto">
      <h3 className="text-sm font-semibold text-slate-800 mb-3">Events</h3>
      {events.length === 0 ? (
        <p className="text-sm text-slate-500">No events yet.</p>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => {
            return (
              <li
                key={event._id}
                className="group relative rounded-lg border border-slate-200 bg-slate-50/80 p-3 text-left"
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    className="flex-1 min-w-0 text-left focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-inset rounded"
                    onClick={() => onViewEvent?.(event)}
                    title="View details"
                  >
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {event.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatEventDate(event.start)} –{" "}
                      {formatEventDate(event.end)}
                    </p>
                    {event.description && (
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </button>
                  <button
                    type="button"
                    className="shrink-0 p-1 text-slate-500 hover:text-slate-700 rounded"
                    aria-label="Edit event"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditEvent?.(event);
                    }}
                  >
                    <PenIcon className="w-4 h-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}

export default EventsList;
