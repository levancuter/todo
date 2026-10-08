import { dayKey } from "./dates.js";

// Only routine todos have `date`; an old one stays in its own day's history
export function todayTodos(todos, today) {
  return todos.filter((t) => !(t.date && t.date < today));
}

// Day an unfinished todo was carried over from, or null
export function carriedFrom(todo, today) {
  if (todo.done || todo.date || !todo.createdAt) return null;
  const day = dayKey(todo.createdAt.toDate());
  return day < today ? day : null;
}

// "overdue" | "today" | "upcoming", or null when there is nothing to show
export function deadlineStatus(todo, today) {
  if (todo.done || !todo.deadline) return null;
  if (todo.deadline < today) return "overdue";
  if (todo.deadline === today) return "today";
  return "upcoming";
}

// Done that day, plus routine todos of that day left unfinished
export function historyTodos(todos, day) {
  return todos.filter((t) => (t.done ? t.doneDate === day : t.date === day));
}
