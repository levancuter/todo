export const WORK_DAYS = [1, 2, 3, 4, 5];
// [start, end) in hours, lunch break 12-13
const WORK_PERIODS = [
  [9, 12],
  [13, 18],
];

// Old todos have no `category`
export function categoryOf(todo) {
  return todo.category === "life" ? "life" : "work";
}

function hourOf(now) {
  return now.getHours() + now.getMinutes() / 60;
}

export function isWorkTime(now = new Date()) {
  if (!WORK_DAYS.includes(now.getDay())) return false;
  const h = hourOf(now);
  return WORK_PERIODS.some(([start, end]) => h >= start && h < end);
}

export function workHoursLeft(now = new Date()) {
  if (!WORK_DAYS.includes(now.getDay())) return 0;
  const h = hourOf(now);
  return WORK_PERIODS.reduce((sum, [start, end]) => sum + Math.max(0, end - Math.max(start, h)), 0);
}
