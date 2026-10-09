export const DEFAULT_ESTIMATE = 3;

// Hours use 0.1 steps; also hides float noise like 0.1 + 0.2
export function round1(h) {
  return Math.round(h * 10) / 10;
}

// Old todos have no `estimate`
export function estimateOf(todo) {
  return typeof todo.estimate === "number" ? todo.estimate : DEFAULT_ESTIMATE;
}

// Actual hours spent, stored as seconds
export function actualOf(todo) {
  return (todo.actualSeconds || 0) / 3600;
}

// Returns null for empty or invalid input; rounds to 0.1h steps
export function parseHours(value) {
  const n = Number(value);
  if (String(value).trim() === "" || !Number.isFinite(n) || n < 0) return null;
  return round1(n);
}

// Skipped todos are not part of the plan, but their actual time still counts
export function sumHours(todos) {
  let total = 0;
  let left = 0;
  let actual = 0;
  for (const t of todos) {
    actual += actualOf(t);
    if (t.skipped) continue;
    const h = estimateOf(t);
    total += h;
    if (!t.done) left += h;
  }
  return { total, left, done: total - left, actual };
}

export function formatHours(h) {
  return `${round1(h)}h`;
}
