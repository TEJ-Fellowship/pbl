import { useState } from "react";

function InsightsPanel({ events = [] }) {
  const [expanded, setExpanded] = useState(true);

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
        <div className="p-4 space-y-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-sm text-slate-600">
            Summary and insight cards will go here.
          </div>
          {events?.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-500">
              {events.length} event(s) in range.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default InsightsPanel;