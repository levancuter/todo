import assert from "node:assert/strict";
import { test } from "node:test";
import { freshSubtasks, newSubtaskId, progressOf, sameSteps, stepsOf, subtasksOf } from "../../src/subtasks.js";

const subtasks = [
  { id: "a", text: "Sửa màu header", done: true },
  { id: "b", text: "Xuất PNG", done: false },
];

test("subtasksOf defaults to none for old todos", () => {
  assert.deepEqual(subtasksOf({}), []);
  assert.deepEqual(progressOf({}), { done: 0, total: 0 });
});

test("progressOf counts ticked steps", () => {
  assert.deepEqual(progressOf({ subtasks }), { done: 1, total: 2 });
});

test("stepsOf and sameSteps ignore ticks", () => {
  assert.deepEqual(stepsOf(subtasks), [
    { id: "a", text: "Sửa màu header" },
    { id: "b", text: "Xuất PNG" },
  ]);
  assert.equal(sameSteps(subtasks, freshSubtasks(subtasks)), true);
  assert.equal(sameSteps(subtasks, [...subtasks].reverse()), false);
  assert.equal(sameSteps(subtasks, [subtasks[0], { ...subtasks[1], text: "Xuất file PNG" }]), false);
  assert.equal(sameSteps(undefined, []), true);
});

test("freshSubtasks untick everything", () => {
  assert.deepEqual(freshSubtasks(subtasks).map((s) => s.done), [false, false]);
  assert.deepEqual(freshSubtasks(undefined), []);
});

test("newSubtaskId gives different ids", () => {
  assert.notEqual(newSubtaskId(), newSubtaskId());
});
