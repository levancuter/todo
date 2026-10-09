import assert from "node:assert/strict";
import { test } from "node:test";
import { autoStopAt, elapsedSeconds, formatClock, nextTodo, totalSeconds } from "../../src/timer.js";

const at = (day, h, m = 0, s = 0) => new Date(2026, 9, day, h, m, s).getTime();

test("elapsed and total seconds", () => {
  const todo = { actualSeconds: 600, timerStartedAt: at(8, 10) };
  assert.equal(elapsedSeconds(todo, at(8, 10, 1, 30)), 90);
  assert.equal(totalSeconds(todo, at(8, 10, 1, 30)), 690);
  assert.equal(elapsedSeconds({ actualSeconds: 600 }, at(8, 11)), 0);
  assert.equal(totalSeconds({}, at(8, 11)), 0);
  // Clock of another device slightly behind: never negative
  assert.equal(elapsedSeconds(todo, at(8, 9, 59)), 0);
});

test("nextTodo: first open todo of the same category, in order", () => {
  const todos = [
    { id: "a", done: true },
    { id: "b", done: false },
    { id: "life", done: false, category: "life" },
    { id: "c", done: false },
    { id: "skipped", done: true, skipped: true },
  ];
  assert.equal(nextTodo(todos, todos[3]).id, "b");
  assert.equal(nextTodo(todos, todos[1]).id, "c");
  assert.equal(nextTodo(todos, todos[2]), null);
  assert.equal(nextTodo([todos[1]], todos[1]), null);
});

test("autoStopAt: work at 12h, 18h, midnight; life at midnight", () => {
  assert.equal(autoStopAt({ timerStartedAt: at(8, 9, 30) }), at(8, 12));
  assert.equal(autoStopAt({ timerStartedAt: at(8, 12, 30) }), at(8, 18));
  assert.equal(autoStopAt({ timerStartedAt: at(8, 19) }), at(9, 0));
  assert.equal(autoStopAt({ timerStartedAt: at(8, 9, 30), category: "life" }), at(9, 0));
});

test("formatClock", () => {
  assert.equal(formatClock(0), "0:00:00");
  assert.equal(formatClock(2535), "0:42:15");
  assert.equal(formatClock(3909), "1:05:09");
});
