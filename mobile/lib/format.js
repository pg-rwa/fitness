export function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function formatDuration(startStr, endStr) {
  if (!startStr || !endStr) return "";
  const mins = Math.round((new Date(endStr) - new Date(startStr)) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export function formatWeight(kg) {
  if (!kg && kg !== 0) return "-";
  return `${Math.round(kg * 10) / 10} kg`;
}

export function dayName(n) {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][n] || "";
}
