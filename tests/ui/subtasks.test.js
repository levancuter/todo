// Subtasks (steps). Clock starts on Thursday 2026-10-08 20:00, outside work time.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { at, openPage, startApp, wait } from "./helpers.js";

const todo = (text, order, fields = {}) => ({
  text,
  done: false,
  order,
  createdAt: at(8, 9),
  category: "work",
  estimate: 1,
  ...fields,
});
const steps = [
  { id: "s1", text: "Khởi động" },
  { id: "s2", text: "Chạy 3 km" },
];
const seed = {
  "todos/a": todo("Chỉnh sửa thiết kế 356", 1),
  "todos/old": todo("Viết báo cáo", 2, {
    createdAt: at(7, 9),
    subtasks: [
      { id: "o1", text: "Lấy số liệu", done: true },
      { id: "o2", text: "Viết", done: false },
    ],
  }),
  "todos/r1_2026-10-08": todo("Tập thể dục", 3, {
    category: "life",
    routineId: "r1",
    date: "2026-10-08",
    subtasks: steps.map((s) => ({ ...s, done: false })),
  }),
  "routines/r1": { text: "Tập thể dục", estimate: 1, category: "life", days: [0, 1, 2, 3, 4, 5, 6], subtasks: steps, lastCreated: "2026-10-08" },
};

let app;
let ui;
let page;

before(async () => {
  app = await startApp();
  ui = await openPage(app, { now: at(8, 20), seed });
  page = ui.page;
  await page.evaluate(() => window.__goOnline());
  await wait(100);
  await ui.tab("work");
});

after(async () => {
  await app?.close();
});

const stepTexts = (path) => ui.get(path).then((t) => t.subtasks.map((s) => s.text));
const stepTag = (id) => ui.text(`${ui.li(id)} .tag.progress`);
const stepRow = (n) => `#detail-steps li:nth-child(${n})`;
const addStep = async (text) => {
  await page.type("#detail-step-new", text + "\n");
  await wait(50);
};

test("add steps with Enter", async () => {
  await ui.clickText("a");
  assert.equal(await page.$("#steps-count"), null);
  for (const text of ["Bước 1", "Bước 2", "Bước 3"]) await addStep(text);
  assert.deepEqual(await stepTexts("todos/a"), ["Bước 1", "Bước 2", "Bước 3"]);
  assert.equal(await ui.val("#detail-step-new"), "");
  assert.equal(await ui.text("#steps-count"), "0/3");
  assert.equal(await stepTag("a"), "0/3");
  // Icon and count on one line, like the other tags
  const height = await page.$eval(`${ui.li("a")} .tag.progress`, (el) => el.getBoundingClientRect().height);
  assert.ok(height < 28, height);
});

test("tick a step", async () => {
  await ui.click(`${stepRow(1)} input[type=checkbox]`);
  assert.equal((await ui.get("todos/a")).subtasks[0].done, true);
  assert.equal(await stepTag("a"), "1/3");
});

test("rename a step after typing stops; an empty name is not saved", async () => {
  await page.click(`${stepRow(2)} .step-text`);
  await page.keyboard.press("End");
  await page.keyboard.type(" sửa");
  await wait(700);
  assert.deepEqual(await stepTexts("todos/a"), ["Bước 1", "Bước 2 sửa", "Bước 3"]);

  await ui.selectAll(`${stepRow(2)} .step-text`);
  await page.keyboard.press("Backspace");
  await page.click("#detail-note");
  await wait(700);
  assert.deepEqual(await stepTexts("todos/a"), ["Bước 1", "Bước 2 sửa", "Bước 3"]);
  assert.equal(await ui.val(`${stepRow(2)} .step-text`), "Bước 2 sửa");
});

test("delete a step", async () => {
  await ui.click(`${stepRow(3)} .step-delete`);
  assert.deepEqual(await stepTexts("todos/a"), ["Bước 1", "Bước 2 sửa"]);
  assert.equal(await stepTag("a"), "1/2");
});

test("move a step by dragging", async () => {
  const box = await (await page.$(`${stepRow(2)} .handle`)).boundingBox();
  await page.mouse.move(box.x + 5, box.y + 5);
  await page.mouse.down();
  for (let y = 0; y >= -50; y -= 10) await page.mouse.move(box.x + 5, box.y + 5 + y);
  await page.mouse.up();
  await wait(300);
  assert.deepEqual(await stepTexts("todos/a"), ["Bước 2 sửa", "Bước 1"]);
  assert.equal(await page.$$eval("#detail-steps li", (els) => els.filter((e) => e.style.transform).length), 0);
});

test("all steps ticked: a hint offers to mark the todo done", async () => {
  assert.equal(await page.$("#steps-hint"), null);
  await ui.click(`${stepRow(1)} input[type=checkbox]`);
  assert.equal((await ui.get("todos/a")).done, false); // never by itself
  assert.ok(await page.$(`${ui.li("a")} .tag.progress.all`));
  await ui.click("#steps-hint button");
  assert.equal((await ui.get("todos/a")).done, true);
  assert.equal(await page.$("#steps-hint"), null);
  await page.keyboard.press("Escape");
});

test("routine: adding a step updates the routine, ticking does not", async () => {
  await ui.tab("life");
  await ui.clickText("r1_2026-10-08");
  await addStep("Giãn cơ");
  const routine = await ui.get("routines/r1");
  assert.deepEqual(
    routine.subtasks.map((s) => s.text),
    ["Khởi động", "Chạy 3 km", "Giãn cơ"],
  );
  assert.ok(routine.subtasks.every((s) => !("done" in s)));
  const writesBefore = (await ui.writes()).filter((w) => w[1] === "routines/r1").length;
  await ui.click(`${stepRow(1)} input[type=checkbox]`);
  assert.equal((await ui.get("todos/r1_2026-10-08")).subtasks[0].done, true);
  assert.equal((await ui.writes()).filter((w) => w[1] === "routines/r1").length, writesBefore);
  await page.keyboard.press("Escape");
});

test("next day: the routine todo starts with nothing ticked, carried todos keep their ticks", async () => {
  await ui.refreshClock(at(9, 20));
  const fresh = await ui.get("todos/r1_2026-10-09");
  assert.deepEqual(
    fresh.subtasks.map((s) => [s.text, s.done]),
    [
      ["Khởi động", false],
      ["Chạy 3 km", false],
      ["Giãn cơ", false],
    ],
  );
  await ui.tab("work");
  assert.equal(await stepTag("old"), "1/2");
});

test("history: steps are shown read-only", async () => {
  await ui.click("#prev-day");
  await wait(50);
  await ui.clickText("a");
  assert.equal(await ui.text("#steps-count"), "2/2");
  assert.ok(await page.$$eval("#detail-steps input", (els) => els.every((e) => e.disabled)));
  assert.equal(await page.$("#detail-step-new"), null);
  assert.equal(await page.$("#detail-steps .step-delete"), null);
  assert.equal(await page.$("#detail-steps .handle"), null);
});

test("no page errors", () => {
  assert.deepEqual(ui.errors, []);
});
