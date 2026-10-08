import assert from "node:assert/strict";
import { test } from "node:test";
import { estimateOf, formatHours, parseEstimate, sumHours } from "../../src/hours.js";

test("estimateOf defaults to 3h for old todos", () => {
  assert.equal(estimateOf({}), 3);
  assert.equal(estimateOf({ estimate: 0 }), 0);
  assert.equal(estimateOf({ estimate: 1.5 }), 1.5);
});

test("parseEstimate rejects invalid input and rounds to 0.5h", () => {
  assert.equal(parseEstimate(""), null);
  assert.equal(parseEstimate("  "), null);
  assert.equal(parseEstimate("abc"), null);
  assert.equal(parseEstimate("-1"), null);
  assert.equal(parseEstimate("0"), 0);
  assert.equal(parseEstimate("2"), 2);
  assert.equal(parseEstimate("1.3"), 1.5);
});

test("sumHours splits total into left and done", () => {
  const todos = [{ done: false }, { estimate: 2, done: true }, { estimate: 0.5, done: false }];
  assert.deepEqual(sumHours(todos), { total: 5.5, left: 3.5, done: 2 });
  assert.deepEqual(sumHours([]), { total: 0, left: 0, done: 0 });
});

test("formatHours", () => {
  assert.equal(formatHours(2.5), "2.5h");
});
