export const DEFAULT_ESTIMATE = 3;

// Old todos have no `estimate`
export function estimateOf(todo) {
  return typeof todo.estimate === "number" ? todo.estimate : DEFAULT_ESTIMATE;
}

// Returns null for empty or invalid input; rounds to 0.5h steps
export function parseEstimate(value) {
  const n = Number(value);
  if (String(value).trim() === "" || !Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 2) / 2;
}

export function sumHours(todos) {
  let total = 0;
  let left = 0;
  for (const t of todos) {
    const h = estimateOf(t);
    total += h;
    if (!t.done) left += h;
  }
  return { total, left, done: total - left };
}

export function formatHours(h) {
  return `${h}h`;
}
