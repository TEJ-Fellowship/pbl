import { useState } from "react";
import { useEvents } from "../hooks/useEvents";
import InsightsPanel from "./InsightPanel";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function Calendar({ onLoginClick, user, onLogout }) {
  const [current, setCurrent] = useState(() => new Date());

  const year = current.getFullYear();
  const month = current.getMonth();

  // Local time: first weekday and days-in-month (avoids UTC/local mismatch hiding a date)
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const { events, loading } = useEvents(user, firstDay, lastDay);
  const startPadding = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const prevMonth = () => {
    setCurrent((d) => new Date(d.getFullYear(), d.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrent((d) => new Date(d.getFullYear(), d.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrent(new Date());
  };

  const today = new Date();
  const isToday = (day) =>
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  // Build grid: empty slots before 1st, then 1..daysInMonth, then pad to full weeks
  const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const gridCells = [...Array(startPadding).fill(null), ...dayNumbers];
  const totalSlots = Math.ceil(gridCells.length / 7) * 7;
  while (gridCells.length < totalSlots) gridCells.push(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-800">Tej Patro</h1>
          <div className="flex items-center gap-3">
            {user?.displayName && (
              <span className="text-sm text-slate-600">
                Logged in as <strong>{user.displayName}</strong>
              </span>
            )}
            <button
              type="button"
              onClick={goToToday}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 transition-colors"
            >
              Today
            </button>
            {user ? (
              <button
                type="button"
                onClick={onLogout}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Log out
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onLoginClick?.()}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left column: Calendar */}
          <div className="flex-1 min-w-0">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prevMonth}
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                aria-label="Previous month"
              >
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <h2 className="text-lg font-semibold text-slate-800 min-w-[180px] text-center">
                {MONTH_NAMES[month]} {year}
              </h2>
              <button
                type="button"
                onClick={nextMonth}
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                aria-label="Next month"
              >
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-lg overflow-hidden">
              {DAY_NAMES.map((day) => (
                <div
                  key={day}
                  className="bg-slate-50 py-2 text-center text-xs font-medium text-slate-500"
                >
                  {day}
                </div>
              ))}
              {gridCells.map((day, i) => (
                <div
                  key={`cell-${year}-${month}-${i}`}
                  className={`min-h-14 flex items-center justify-center text-sm select-none ${
                    day != null
                      ? isToday(day)
                        ? "bg-blue-500 text-white font-semibold rounded-md ring-2 ring-blue-600 ring-inset shadow-sm"
                        : "bg-white text-slate-800 hover:bg-slate-100"
                      : "bg-slate-50/50 text-slate-300"
                  }`}
                >
                  {day != null ? String(day) : ""}
                </div>
              ))}
            </div>
          </div>
            </div>
          </div>

          {/* Right column: Insights panel */}
          <aside className="w-full md:w-72 md:flex-shrink-0">
  <InsightsPanel events={events} user={user} loading={loading} />
</aside>
        </div>
      </main>
    </div>
  );
}

export default Calendar;
