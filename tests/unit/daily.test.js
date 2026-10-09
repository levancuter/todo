import assert from "node:assert/strict";
import { test } from "node:test";
import { carriedFrom, deadlineStatus, historyTodos, todayTodos } from "../../src/daily.js";

const TODAY = "2026-10-08";
const ts = (date) => ({ toDate: () => date });

const todos = [
  { id: "open-old", done: false, createdAt: ts(new Date(2026, 9, 6, 10)) },
  { id: "open-new", done: false, createdAt: ts(new Date(2026, 9, 8, 1)) },
  { id: "pending", done: false, createdAt: null },
  { id: "done-today", done: true, doneDate: TODAY, createdAt: ts(new Date(2026, 9, 1)) },
  { id: "routine-today", done: false, routineId: "r", date: TODAY },
  { id: "routine-old", done: false, routineId: "r", date: "2026-10-07" },
];

test("todayTodos hides routine todos of earlier days", () => {
  assert.deepEqual(
    todayTodos(todos, TODAY).map((t) => t.id),
    ["open-old", "open-new", "pending", "done-today", "routine-today"],
  );
});

test("carriedFrom only for unfinished normal todos created before today", () => {
  assert.equal(carriedFrom(todos[0], TODAY), "2026-10-06");
  assert.equal(carriedFrom(todos[1], TODAY), null);
  assert.equal(carriedFrom(todos[2], TODAY), null);
  assert.equal(carriedFrom(todos[3], TODAY), null);
  assert.equal(carriedFrom(todos[4], TODAY), null);
});

test("historyTodos: done that day plus unfinished routine todos", () => {
  const day = "2026-10-07";
  const items = [
    { id: "a", done: true, doneDate: day },
    { id: "b", done: false, routineId: "r", date: day },
    { id: "c", done: true, routineId: "r", date: day, doneDate: day },
    { id: "d", done: true, doneDate: TODAY },
  ];
  assert.deepEqual(historyTodos(items, day).map((t) => t.id), ["a", "b", "c"]);
});

test("deadlineStatus: overdue, today, upcoming; nothing when done or no deadline", () => {
  assert.equal(deadlineStatus({ done: false, deadline: "2026-10-07" }, TODAY), "overdue");
  assert.equal(deadlineStatus({ done: false, deadline: TODAY }, TODAY), "today");
  assert.equal(deadlineStatus({ done: false, deadline: "2026-10-12" }, TODAY), "upcoming");
  assert.equal(deadlineStatus({ done: true, deadline: "2026-10-07" }, TODAY), null);
  assert.equal(deadlineStatus({ done: false, deadline: null }, TODAY), null);
  assert.equal(deadlineStatus({ done: false }, TODAY), null);
});
