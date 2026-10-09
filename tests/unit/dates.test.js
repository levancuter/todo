import assert from "node:assert/strict";
import { test } from "node:test";
import { addDays, dayKey, formatDay, formatLongDay, weekdayOf } from "../../src/dates.js";

test("dayKey uses local date", () => {
  assert.equal(dayKey(new Date(2026, 9, 8, 23, 59)), "2026-10-08");
  assert.equal(dayKey(new Date(2026, 0, 5)), "2026-01-05");
});

test("addDays crosses month, year and leap day", () => {
  assert.equal(addDays("2026-10-01", -1), "2026-09-30");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2024-02-28", 1), "2024-02-29");
});

test("weekdayOf and formatDay", () => {
  assert.equal(weekdayOf("2026-10-08"), 4); // Thursday
  assert.equal(weekdayOf("2026-10-11"), 0); // Sunday
  assert.equal(formatDay("2026-10-07"), "07/10");
});

test("formatLongDay adds the weekday name", () => {
  assert.equal(formatLongDay("2026-10-09"), "Thứ 6, 09/10");
  assert.equal(formatLongDay("2026-10-11"), "Chủ nhật, 11/10");
});
