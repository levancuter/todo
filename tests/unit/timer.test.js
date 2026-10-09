import assert from "node:assert/strict";
import { test } from "node:test";
import { autoStart, autoStopAt, elapsedSeconds, formatClock, nextTodo, totalSeconds } from "../../src/timer.js";

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

test("autoStart: first open work todo, from the period start", () => {
  const todos = [
    { id: "done", done: true },
    { id: "life", done: false, category: "life" },
    { id: "a", done: false },
    { id: "b", done: false },
  ];
  assert.deepEqual(autoStart(todos, at(8, 9, 40)), { todo: todos[2], at: at(8, 9) });
  assert.deepEqual(autoStart(todos, at(8, 13, 20)), { todo: todos[2], at: at(8, 13) });
});

test("autoStart: nothing outside work time, while a timer runs, or with no open work", () => {
  const todos = [{ id: "a", done: false }];
  assert.equal(autoStart(todos, at(8, 12, 30)), null);
  assert.equal(autoStart(todos, at(10, 10)), null); // Saturday
  assert.equal(autoStart([...todos, { id: "l", category: "life", timerStartedAt: at(8, 10) }], at(8, 10, 5)), null);
  assert.equal(autoStart([{ id: "d", done: true }], at(8, 10)), null);
});

test("autoStart: resumes the todo stopped at the break", () => {
  const todos = [
    { id: "a", done: false, timerStoppedAt: at(8, 12) },
    { id: "b", done: false, timerResume: true, timerStoppedAt: at(8, 12) },
  ];
  assert.deepEqual(autoStart(todos, at(8, 13, 2)), { todo: todos[1], at: at(8, 13) });
});

test("autoStart: after a stop in the same period, counts from now", () => {
  const todos = [
    { id: "done", done: true, timerStoppedAt: at(8, 10) },
    { id: "new", done: false },
  ];
  assert.deepEqual(autoStart(todos, at(8, 10, 30)), { todo: todos[1], at: at(8, 10, 30) });
});
