// Timer with auto-advance and auto-stop. Clock starts on Thursday 2026-10-08 10:00.
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
const seed = {
  "todos/a": todo("Thiết kế màn hình", 1, { estimate: 2 }),
  "todos/b": todo("Viết API", 2),
  "todos/c": todo("Review PR", 3),
  "todos/d": todo("Cập nhật tài liệu", 4),
  "todos/l1": todo("Tập thể dục", 5, { category: "life" }),
};

let app;
let ui;
let page;

before(async () => {
  app = await startApp();
  ui = await openPage(app, { now: at(8, 10), seed });
  page = ui.page;
});

after(async () => {
  await app?.close();
});

const running = async () =>
  page.evaluate(() =>
    [...window.__writes.reduce((ids, w) => ids.add(w[1]), new Set())]
      .filter((path) => path.startsWith("todos/") && window.__get(path)?.timerStartedAt)
      .map((path) => path.slice(6)),
  );
const setNow = (ms) => page.evaluate((t) => window.__setNow(t), ms);
const play = (id) => ui.click(`${ui.li(id)} .timer-button`);

test("start a timer from the list", async () => {
  await play("a");
  const a = await ui.get("todos/a");
  assert.ok(Math.abs(a.timerStartedAt - at(8, 10)) < 5000);
  assert.ok(await page.$eval(ui.li("a"), (el) => el.classList.contains("running")));
  assert.equal(await page.$eval(`${ui.li("a")} .timer-button`, (el) => el.getAttribute("aria-label")), "Tạm dừng bấm giờ");
  assert.equal(await page.$eval(`${ui.li("b")} .timer-button`, (el) => el.getAttribute("aria-label")), "Bắt đầu bấm giờ");
});

test("the clock counts every second", async () => {
  await setNow(at(8, 10, 30));
  await wait(1200);
  // Started a moment after 10:00, so about 30 minutes later
  assert.match(await ui.text(`${ui.li("a")} .timer-clock`), /^0:(29:5\d|30:0\d)$/);
});

test("pause adds the time to actual hours", async () => {
  await ui.click(`${ui.li("a")} .timer-button`);
  const a = await ui.get("todos/a");
  assert.equal(a.timerStartedAt, null);
  assert.ok(a.actualSeconds >= 1800 && a.actualSeconds < 1815, a.actualSeconds);
  assert.equal(await page.$(`${ui.li("a")} .timer-clock`), null);
  assert.equal(await ui.text(`${ui.li("a")} .estimate`), "0.5/2h");
});

test("only one timer runs at a time", async () => {
  await play("a");
  await play("b");
  assert.deepEqual(await running(), ["b"]);
  assert.equal((await ui.get("todos/a")).timerStartedAt, null);
});

test("ticking the running todo starts the next one", async () => {
  await ui.click(`${ui.li("b")} input[type=checkbox]`);
  const b = await ui.get("todos/b");
  assert.equal(b.done, true);
  assert.equal(b.timerStartedAt, null);
  assert.deepEqual(await running(), ["a"]); // first open todo in order
});

test("skipping the running todo keeps its time and starts the next one", async () => {
  const before = (await ui.get("todos/a")).actualSeconds;
  await setNow(at(8, 10, 40));
  await ui.click(`${ui.li("a")} .row-action.skip`);
  const a = await ui.get("todos/a");
  assert.equal(a.skipped, true);
  // Restarted a moment after 10:30, skipped at 10:40
  assert.ok(a.actualSeconds - before > 585 && a.actualSeconds - before < 615, a.actualSeconds - before);
  assert.deepEqual(await running(), ["c"]);
});

test("auto-advance stays in the category and stops at the end", async () => {
  await ui.click(`${ui.li("c")} input[type=checkbox]`);
  assert.deepEqual(await running(), ["d"]);
  await ui.click(`${ui.li("d")} input[type=checkbox]`);
  assert.deepEqual(await running(), []); // the life todo is not started
});

test("start and pause from the panel", async () => {
  await ui.tab("life");
  await ui.clickText("l1");
  assert.equal(await ui.text("#detail-timer"), "Bắt đầu");
  await ui.click("#detail-timer");
  assert.deepEqual(await running(), ["l1"]);
  assert.equal(await ui.text("#detail-timer"), "Tạm dừng");
  assert.ok(await page.$("#detail-clock"));
  assert.equal(await page.$eval("#detail-actual", (el) => el.disabled), true);
  await ui.click("#detail-timer");
  assert.deepEqual(await running(), []);
  assert.equal(await page.$("#detail-clock"), null);
  assert.equal(await page.$eval("#detail-actual", (el) => el.disabled), false);
  await page.keyboard.press("Escape");
});

test("a forgotten work timer stops at 12h", async () => {
  await ui.tab("work");
  await page.type("#new-todo", "Báo cáo tuần\n");
  await wait(100);
  const id = (await ui.ids()).at(-1);
  await setNow(at(8, 11, 50));
  await play(id);
  await ui.refreshClock(at(8, 12, 10));
  const todo = await ui.get("todos/" + id);
  assert.equal(todo.timerStartedAt, null);
  assert.ok(todo.actualSeconds > 590 && todo.actualSeconds <= 600, todo.actualSeconds);
});

test("a forgotten life timer stops at midnight", async () => {
  await ui.tab("life");
  const before = (await ui.get("todos/l1")).actualSeconds;
  await play("l1");
  await ui.refreshClock(at(9, 0, 5));
  const l1 = await ui.get("todos/l1");
  assert.equal(l1.timerStartedAt, null);
  const added = l1.actualSeconds - before;
  assert.ok(added > 42590 && added <= 42600, added); // 12:10 -> 24:00
});

test("no page errors", () => {
  assert.deepEqual(ui.errors, []);
});
