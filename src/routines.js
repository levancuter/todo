import { categoryOf, WORK_DAYS } from "./category.js";
import { weekdayOf } from "./dates.js";

export const REPEAT_DAILY = [0, 1, 2, 3, 4, 5, 6];
export const REPEAT_WEEKDAYS = [1, 2, 3, 4, 5];

// Routines that still need a todo today. Work routines skip weekends.
// `lastCreated` (not the todos) decides, so deleting today's todo doesn't bring it back.
export function dueRoutines(routines, today) {
  const weekday = weekdayOf(today);
  return routines.filter(
    (r) =>
      (r.lastCreated || "") < today &&
      r.days.includes(weekday) &&
      (categoryOf(r) === "life" || WORK_DAYS.includes(weekday)),
  );
}

export function repeatMode(days) {
  if (!days || days.length === 0) return "none";
  const key = [...days].sort().join();
  if (key === REPEAT_DAILY.join()) return "daily";
  if (key === REPEAT_WEEKDAYS.join()) return "weekdays";
  return "custom";
}
