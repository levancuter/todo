import { categoryOf } from "./category.js";

// Seconds since the timer started (timerStartedAt is ms since epoch)
export function elapsedSeconds(todo, now) {
  if (!todo.timerStartedAt) return 0;
  return Math.max(0, Math.floor((now - todo.timerStartedAt) / 1000));
}

export function totalSeconds(todo, now) {
  return (todo.actualSeconds || 0) + elapsedSeconds(todo, now);
}

// Next todo to time after `closed`: the first open one of the same
// category, in priority order. `todos` must be sorted by order.
export function nextTodo(todos, closed) {
  const category = categoryOf(closed);
  return todos.find((t) => t.id !== closed.id && !t.done && categoryOf(t) === category) ?? null;
}

// When a forgotten timer stops by itself: work todos at 12h, 18h and
// midnight, other todos at midnight. Returns ms since epoch.
export function autoStopAt(todo) {
  const start = new Date(todo.timerStartedAt);
  const hours = categoryOf(todo) === "work" ? [12, 18, 24] : [24];
  for (const h of hours) {
    const cutoff = new Date(start);
    cutoff.setHours(h, 0, 0, 0); // 24 = next midnight
    if (cutoff > start) return cutoff.getTime();
  }
  return start.getTime();
}

// "1:05:09"
export function formatClock(seconds) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${Math.floor(seconds / 3600)}:${pad(Math.floor((seconds % 3600) / 60))}:${pad(seconds % 60)}`;
}
