function formatEventDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function EventsList({ events = [] }) {
  return (
    <aside className="w-80 shrink-0 border-l border-slate-200 bg-white p-4 overflow-y-auto">
      <h3 className="text-sm font-semibold text-slate-800 mb-3">Events</h3>
      {events.length === 0 ? (
        <p className="text-sm text-slate-500">No events yet.</p>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => (
            <li
              key={event._id}
              className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 text-left"
            >
              <p className="text-sm font-medium text-slate-800 truncate">
                {event.title}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {formatEventDate(event.start)} – {formatEventDate(event.end)}
              </p>
              {event.description && (
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                  {event.description}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

export default EventsList;
