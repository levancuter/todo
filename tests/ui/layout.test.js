// Row layout: the hours column lines up and a running clock never moves things.
// Clock starts on Thursday 2026-10-08 at 10:00 (work time: the first work todo is timed).
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
  "todos/run": todo("Kiểm tra thao tác của 351 sau khi chỉnh sửa", 1, { actualSeconds: 360 }),
  "todos/open": todo("Kiểm tra chuyển đổi xls -> xlsx của các report", 2, { estimate: 3 }),
  "todos/done": todo("Viết furikaeri", 3, { estimate: 0.5, done: true, doneDate: "2026-10-08" }),
  "todos/skip": todo("Dọn backlog", 4, { done: true, skipped: true, doneDate: "2026-10-08" }),
  "todos/old": todo("Viết báo cáo tháng 9", 5, { estimate: 0.5, createdAt: at(7, 9) }),
};

let app;
let ui;
let page;

before(async () => {
  app = await startApp();
  ui = await openPage(app, { now: at(8, 9), seed });
  page = ui.page;
  await page.evaluate(() => window.__goOnline());
  await wait(200);
});

after(async () => {
  await app?.close();
});

const rightEdges = () =>
  page.$$eval("#todo-list .estimate", (els) => els.map((e) => Math.round(e.getBoundingClientRect().right)));
const box = (sel) =>
  page.$eval(sel, (el) => {
    const r = el.getBoundingClientRect();
    return `${Math.round(r.width)}x${Math.round(r.height)}`;
  });

test("the hours column lines up on every row", async () => {
  assert.ok(await page.$(`${ui.li("run")} .timer-clock`)); // running, no pause during work time
  const edges = await rightEdges();
  assert.equal(edges.length, 5);
  assert.equal(new Set(edges).size, 1, edges.join(", "));
});

test("no empty space on the right: the timer column ends at the row's padding", async () => {
  const gaps = await page.$$eval("#todo-list .todo", (rows) =>
    rows.map((li) => Math.round(li.getBoundingClientRect().right - li.querySelector(".trail").getBoundingClientRect().right)),
  );
  assert.ok(gaps.every((gap) => gap <= 13), gaps.join(", "));
});

test("skip and delete show on hover only and do not move the hours column", async () => {
  const visibility = (id) => page.$eval(`${ui.li(id)} .row-actions`, (el) => getComputedStyle(el).visibility);
  const before = await rightEdges();
  await page.mouse.move(0, 0);
  assert.equal(await visibility("open"), "hidden");
  await page.hover(`${ui.li("open")} .title`);
  assert.equal(await visibility("open"), "visible");
  assert.deepEqual(await rightEdges(), before);
  await page.mouse.move(0, 0);
});

test("a ticking clock does not move the title or the row", async () => {
  // The two moments from the bug report: 6 minutes already spent, then 0:06:46 and 0:07:11
  const title = `${ui.li("run")} .title`;
  const sizes = [];
  for (const seconds of [46, 71]) {
    await page.evaluate((t) => window.__setNow(t), at(8, 9) + seconds * 1000);
    await wait(1100);
    sizes.push([await box(title), await box(ui.li("run")), await ui.text(`${ui.li("run")} .timer-clock`)]);
  }
  assert.match(sizes[0][2], /^0:06:4\d$/);
  assert.match(sizes[1][2], /^0:07:1\d$/);
  assert.equal(sizes[0][0], sizes[1][0]);
  assert.equal(sizes[0][1], sizes[1][1]);
});

test("phone width: the hours column still lines up", async () => {
  await page.setViewport({ width: 390, height: 800 });
  await wait(100);
  const edges = await rightEdges();
  assert.equal(new Set(edges).size, 1, edges.join(", "));
});

test("no page errors", () => {
  assert.deepEqual(ui.errors, []);
});
