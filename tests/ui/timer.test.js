// Automatic timer: during work time a work todo is always timed.
// Clock starts on Thursday 2026-10-08 10:00 (work time).
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

const running = () =>
  page.evaluate(() =>
    ["a", "b", "c", "d", "l1", ...window.__writes.map((w) => w[1].slice(6))]
      .filter((id, i, all) => all.indexOf(id) === i && window.__get("todos/" + id)?.timerStartedAt)
      .sort(),
  );
const setNow = (ms) => page.evaluate((t) => window.__setNow(t), ms);
const play = (id) => ui.click(`${ui.li(id)} .timer-button`);
const activeTab = () => page.$eval("#tabs .active", (el) => el.dataset.tab);
const near = (ms, expected, seconds = 10) => Math.abs(ms - expected) < seconds * 1000;

test("nothing starts before the data comes from the server", async () => {
  assert.deepEqual(await running(), []);
});

test("work time: the first open work todo is timed from the period start", async () => {
  await page.evaluate(() => window.__goOnline());
  await wait(150);
  assert.deepEqual(await running(), ["a"]);
  assert.equal((await ui.get("todos/a")).timerStartedAt, at(8, 9)); // app opened late
  assert.ok(await page.$eval(ui.li("a"), (el) => el.classList.contains("running")));
  assert.equal(await page.$(`${ui.li("a")} .timer-button`), null); // no pause during work time
  assert.equal(await page.$eval(`${ui.li("b")} .timer-button`, (el) => el.getAttribute("aria-label")), "Bắt đầu bấm giờ");
  await wait(1100);
  assert.match(await ui.text(`${ui.li("a")} .timer-clock`), /^1:00:0\d$/);
});

test("▶ on another work todo switches the timer", async () => {
  await play("b");
  assert.deepEqual(await running(), ["b"]);
  const a = await ui.get("todos/a");
  assert.ok(a.actualSeconds >= 3600 && a.actualSeconds < 3615, a.actualSeconds);
  assert.ok(near(a.timerStoppedAt, at(8, 10)));
});

test("ticking the running todo starts the next one", async () => {
  await ui.click(`${ui.li("b")} input[type=checkbox]`);
  assert.equal((await ui.get("todos/b")).done, true);
  assert.deepEqual(await running(), ["a"]); // first open todo in order
});

test("skipping the running todo keeps its time and starts the next one", async () => {
  const before = (await ui.get("todos/a")).actualSeconds;
  await setNow(at(8, 10, 40));
  await ui.click(`${ui.li("a")} .row-action.skip`);
  const a = await ui.get("todos/a");
  assert.equal(a.skipped, true);
  const added = a.actualSeconds - before;
  assert.ok(added > 2380 && added < 2415, added); // about 10:00 -> 10:40
  assert.deepEqual(await running(), ["c"]);
});

test("the panel has no pause for work todos during work time", async () => {
  await ui.clickText("c");
  assert.equal(await page.$("#detail-timer"), null);
  assert.ok(await page.$("#detail-clock"));
  assert.equal(await page.$eval("#detail-actual", (el) => el.disabled), true);
  await page.keyboard.press("Escape");
});

test("after all work is done, a new todo is timed from now", async () => {
  await ui.click(`${ui.li("c")} input[type=checkbox]`);
  assert.deepEqual(await running(), ["d"]);
  await ui.click(`${ui.li("d")} input[type=checkbox]`);
  assert.deepEqual(await running(), []);
  await page.type("#new-todo", "Báo cáo tuần\n");
  await wait(200);
  const id = (await ui.ids()).at(-1);
  assert.deepEqual(await running(), [id]);
  // Not from 9:00: a timer already ran in this period
  assert.ok(near((await ui.get("todos/" + id)).timerStartedAt, at(8, 10, 40)));
});

test("12h: the timer stops and the same todo resumes at 13h; tabs follow work time", async () => {
  const id = (await ui.ids()).at(-1);
  await ui.click(`${ui.li("b")} input[type=checkbox]`); // reopen b, before the running todo
  assert.deepEqual(await running(), [id]);

  await ui.refreshClock(at(8, 12, 10));
  assert.deepEqual(await running(), []);
  const stopped = await ui.get("todos/" + id);
  assert.equal(stopped.timerStoppedAt, at(8, 12));
  assert.equal(stopped.timerResume, true);
  assert.equal(await activeTab(), "life");

  await ui.refreshClock(at(8, 13, 5));
  assert.deepEqual(await running(), [id]); // not b, which is first in order
  assert.equal((await ui.get("todos/" + id)).timerStartedAt, at(8, 13));
  assert.equal(await activeTab(), "work");
});

test("life todos: started and paused by hand; work restarts by itself", async () => {
  await ui.tab("life");
  await play("l1");
  assert.deepEqual(await running(), ["l1"]); // only one timer
  assert.equal(await page.$eval(`${ui.li("l1")} .timer-button`, (el) => el.getAttribute("aria-label")), "Tạm dừng bấm giờ");
  await play("l1");
  await wait(100);
  assert.deepEqual(await running(), ["b"]); // nothing running in work time: first open work todo
});

test("outside work time: work timers stop at 18h and can be paused", async () => {
  await ui.refreshClock(at(8, 18, 30));
  assert.deepEqual(await running(), []);
  assert.equal(await activeTab(), "life");
  await ui.tab("work");
  await play("b");
  assert.deepEqual(await running(), ["b"]);
  assert.equal(await page.$eval(`${ui.li("b")} .timer-button`, (el) => el.getAttribute("aria-label")), "Tạm dừng bấm giờ");
  await play("b");
  assert.deepEqual(await running(), []);
});

test("a life timer stops at midnight", async () => {
  await ui.tab("life");
  const before = (await ui.get("todos/l1")).actualSeconds;
  await play("l1");
  await ui.refreshClock(at(9, 0, 5));
  const l1 = await ui.get("todos/l1");
  assert.equal(l1.timerStartedAt, null);
  const added = l1.actualSeconds - before;
  assert.ok(added > 19790 && added <= 19800, added); // 18:30 -> 24:00
});

test("no page errors", () => {
  assert.deepEqual(ui.errors, []);
});
