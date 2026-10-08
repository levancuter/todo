// Days are local "YYYY-MM-DD" strings, so they compare and sort as text
export function dayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDay(day) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(day, n) {
  const date = parseDay(day);
  date.setDate(date.getDate() + n);
  return dayKey(date);
}

// 0 = Sunday ... 6 = Saturday
export function weekdayOf(day) {
  return parseDay(day).getDay();
}

export function formatDay(day) {
  const [, m, d] = day.split("-");
  return `${d}/${m}`;
}
