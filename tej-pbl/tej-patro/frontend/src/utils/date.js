/**
 * Format an ISO date string for display in lists and tooltips.
 * Returns a short date + time (e.g. "Feb 26, 2025, 10:30 AM").
 */
export function formatEventDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
