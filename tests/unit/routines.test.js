import assert from "node:assert/strict";
import { test } from "node:test";
import { dueRoutines, REPEAT_DAILY, REPEAT_WEEKDAYS, repeatLabel, repeatMode } from "../../src/routines.js";

const THURSDAY = "2026-10-08";
const SATURDAY = "2026-10-10";

const routines = [
  { id: "daily-life", days: REPEAT_DAILY, category: "life" },
  { id: "daily-work", days: REPEAT_DAILY, category: "work" },
  { id: "created-thursday", days: REPEAT_DAILY, category: "life", lastCreated: THURSDAY },
  { id: "created-before", days: REPEAT_DAILY, category: "life", lastCreated: "2026-10-07" },
  { id: "monday-only", days: [1], category: "life" },
  { id: "thursday-work", days: [4], category: "work" },
];

test("dueRoutines: matching weekday and not created today", () => {
  assert.deepEqual(
    dueRoutines(routines, THURSDAY).map((r) => r.id),
    ["daily-life", "daily-work", "created-before", "thursday-work"],
  );
});

test("dueRoutines: work routines skip weekends", () => {
  assert.deepEqual(
    dueRoutines(routines, SATURDAY).map((r) => r.id),
    ["daily-life", "created-thursday", "created-before"],
  );
});

test("repeatMode", () => {
  assert.equal(repeatMode(undefined), "none");
  assert.equal(repeatMode([]), "none");
  assert.equal(repeatMode([6, 5, 4, 3, 2, 1, 0]), "daily");
  assert.equal(repeatMode(REPEAT_WEEKDAYS), "weekdays");
  assert.equal(repeatMode([1, 3]), "custom");
});

test("repeatLabel", () => {
  assert.equal(repeatLabel([]), null);
  assert.equal(repeatLabel(REPEAT_DAILY), "Hằng ngày");
  assert.equal(repeatLabel(REPEAT_WEEKDAYS), "T2–T6");
  assert.equal(repeatLabel([0, 3, 1]), "T2, T4, CN");
});
