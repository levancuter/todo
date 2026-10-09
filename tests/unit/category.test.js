import assert from "node:assert/strict";
import { test } from "node:test";
import { categoryOf, isWorkTime, WORK_HOURS_PER_DAY, workHoursLeft, workPeriodStart } from "../../src/category.js";

// 2026-10-08 is a Thursday, 2026-10-10 a Saturday
const at = (day, h, m = 0) => new Date(2026, 9, day, h, m);

test("categoryOf defaults to work", () => {
  assert.equal(categoryOf({}), "work");
  assert.equal(categoryOf({ category: "life" }), "life");
  assert.equal(categoryOf({ category: "work" }), "work");
});

test("isWorkTime: Mon-Fri 9-12 and 13-18", () => {
  assert.equal(isWorkTime(at(8, 8, 59)), false);
  assert.equal(isWorkTime(at(8, 9)), true);
  assert.equal(isWorkTime(at(8, 12)), false);
  assert.equal(isWorkTime(at(8, 12, 30)), false);
  assert.equal(isWorkTime(at(8, 13)), true);
  assert.equal(isWorkTime(at(8, 17, 59)), true);
  assert.equal(isWorkTime(at(8, 18)), false);
  assert.equal(isWorkTime(at(10, 10)), false);
});

test("workHoursLeft skips lunch break and weekends", () => {
  assert.equal(workHoursLeft(at(8, 7)), 8);
  assert.equal(workHoursLeft(at(8, 9)), 8);
  assert.equal(workHoursLeft(at(8, 11)), 6);
  assert.equal(workHoursLeft(at(8, 12, 30)), 5);
  assert.equal(workHoursLeft(at(8, 13)), 5);
  assert.equal(workHoursLeft(at(8, 17, 30)), 0.5);
  assert.equal(workHoursLeft(at(8, 18)), 0);
  assert.equal(workHoursLeft(at(8, 20)), 0);
  assert.equal(workHoursLeft(at(10, 10)), 0);
});

test("a work day has 8 hours", () => {
  assert.equal(WORK_HOURS_PER_DAY, 8);
});

test("workPeriodStart: start of the current work period", () => {
  assert.equal(workPeriodStart(at(8, 10, 40)), at(8, 9).getTime());
  assert.equal(workPeriodStart(at(8, 13, 5)), at(8, 13).getTime());
  assert.equal(workPeriodStart(at(8, 12, 30)), null);
  assert.equal(workPeriodStart(at(8, 19)), null);
  assert.equal(workPeriodStart(at(10, 10)), null); // Saturday
});
