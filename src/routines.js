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

const DAY_NAMES = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

// Short label for the list, e.g. "Hằng ngày", "T2–T6", "T2, T4"
export function repeatLabel(days) {
  const mode = repeatMode(days);
  if (mode === "none") return null;
  if (mode === "daily") return "Hằng ngày";
  if (mode === "weekdays") return "T2–T6";
  // Monday first, Sunday last
  return [...days].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map((d) => DAY_NAMES[d]).join(", ");
}

export function repeatMode(days) {
  if (!days || days.length === 0) return "none";
  const key = [...days].sort().join();
  if (key === REPEAT_DAILY.join()) return "daily";
  if (key === REPEAT_WEEKDAYS.join()) return "weekdays";
  return "custom";
}
