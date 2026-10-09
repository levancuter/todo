import assert from "node:assert/strict";
import { test } from "node:test";
import { actualOf, estimateOf, formatHours, parseHours, sumHours } from "../../src/hours.js";

test("estimateOf defaults to 3h for old todos", () => {
  assert.equal(estimateOf({}), 3);
  assert.equal(estimateOf({ estimate: 0 }), 0);
  assert.equal(estimateOf({ estimate: 1.5 }), 1.5);
});

test("actualOf converts seconds, 0 for old todos", () => {
  assert.equal(actualOf({}), 0);
  assert.equal(actualOf({ actualSeconds: 5400 }), 1.5);
});

test("parseHours rejects invalid input and rounds to 0.1h", () => {
  assert.equal(parseHours(""), null);
  assert.equal(parseHours("  "), null);
  assert.equal(parseHours("abc"), null);
  assert.equal(parseHours("-1"), null);
  assert.equal(parseHours("0"), 0);
  assert.equal(parseHours("2"), 2);
  assert.equal(parseHours("0.1"), 0.1);
  assert.equal(parseHours("1.34"), 1.3);
  assert.equal(parseHours("1.35"), 1.4);
});

test("sumHours splits total into left and done", () => {
  const todos = [{ done: false }, { estimate: 2, done: true }, { estimate: 0.5, done: false }];
  assert.deepEqual(sumHours(todos), { total: 5.5, left: 3.5, done: 2, actual: 0 });
  assert.deepEqual(sumHours([]), { total: 0, left: 0, done: 0, actual: 0 });
});

test("sumHours leaves skipped todos out of the plan but keeps their actual time", () => {
  const todos = [
    { estimate: 2, done: false, actualSeconds: 1800 },
    { estimate: 1, done: true, skipped: true, actualSeconds: 900 },
  ];
  assert.deepEqual(sumHours(todos), { total: 2, left: 2, done: 0, actual: 0.75 });
});

test("sumHours adds the running timer to actual time", () => {
  const now = new Date(2026, 9, 8, 10, 30).getTime();
  const todos = [{ estimate: 2, done: false, actualSeconds: 1800, timerStartedAt: now - 1800 * 1000 }];
  assert.equal(sumHours(todos, now).actual, 1);
});

test("formatHours rounds to 0.1h and hides float noise", () => {
  assert.equal(formatHours(2.5), "2.5h");
  assert.equal(formatHours(0.1 + 0.2), "0.3h");
  assert.equal(formatHours(1.26), "1.3h");
});
