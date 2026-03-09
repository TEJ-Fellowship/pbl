import { useState, useMemo } from "react";

// Local week: Sunday 00:00:00 to Saturday 23:59:59.999 (matches calendar getDay())
function getWeekBounds(referenceDate = new Date()) {
  const d = new Date(referenceDate);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  const weekStart = d.getTime();
  const weekEnd = new Date(d);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return { weekStart, weekEnd };
}

function eventOverlapsWeek(event, weekStart, weekEnd) {
  const start = event.start instanceof Date ? event.start.getTime() : new Date(event.start).getTime();
  const end = event.end instanceof Date ? event.end.getTime() : new Date(event.end).getTime();
  return end >= weekStart && start <= weekEnd;
}

function formatEventTime(event) {
  const start = event.start instanceof Date ? event.start : new Date(event.start);
  if (event.isAllDay) return "All day";
  return start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

// Static tips; later: pick by day (e.g. tips[date.getDay() % tips.length]) or random
const SCHEDULING_TIPS = [
  "Try scheduling deep focus work before 10 AM when energy is highest.",
];

function getSchedulingTip() {
  return SCHEDULING_TIPS[0];
  // Later: return SCHEDULING_TIPS[Math.floor(Math.random() * SCHEDULING_TIPS.length)];
  // Or: return SCHEDULING_TIPS[new Date().getDay() % SCHEDULING_TIPS.length];
}

function InsightsPanel({ events = [] }) {
  const [expanded, setExpanded] = useState(true);

  const { weekStart, weekEnd } = useMemo(() => getWeekBounds(), []);
  const thisWeekEvents = useMemo(
    () => (Array.isArray(events) ? events : []).filter((e) => eventOverlapsWeek(e, weekStart, weekEnd)),
    [events, weekStart, weekEnd]
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden sticky top-4">
      <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-slate-600" aria-hidden="true">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </span>
          <h2 className="text-sm font-semibold text-slate-800">AI Insights</h2>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 rounded px-2 py-1.5 transition-colors"
        >
          {expanded ? "Less" : "More"}
        </button>
      </div>

      {expanded && (
        <div className="p-4 space-y-4">
          {/* This week — blue-grey */}
          <div className="rounded-xl border border-slate-200 bg-slate-100/80 p-4 text-sm">
            <p className="font-semibold text-slate-800 mb-2">
              This week: You have {thisWeekEvents.length} event{thisWeekEvents.length !== 1 ? "s" : ""} scheduled
            </p>
            {thisWeekEvents.length > 0 ? (
              <ul className="list-none space-y-1.5 text-slate-600">
                {thisWeekEvents.map((ev) => (
                  <li key={ev._id || ev.id || ev.title + ev.start} className="flex flex-col gap-0.5">
                    <span className="font-medium text-slate-800">{ev.title}</span>
                    <span className="text-xs text-slate-500">{formatEventTime(ev)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 text-xs">No events this week.</p>
            )}
          </div>

          {/* Tip — green */}
          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/90 p-4 flex gap-3 text-sm">
            <span className="text-emerald-600 flex-shrink-0 mt-0.5" aria-hidden="true">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </span>
            <div>
              <p className="font-semibold text-slate-800 text-xs uppercase tracking-wide mb-1">Tip</p>
              <p className="text-slate-600">{getSchedulingTip()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InsightsPanel;