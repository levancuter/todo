// 0.1h steps, actual hours and skipping. Clock starts on Thursday 2026-10-08 10:00.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { at, openPage, startApp, wait } from "./helpers.js";

const todo = (text, order, fields = {}) => ({
  text,
  done: false,
  order,
  createdAt: at(8, 9),
  category: "work",
  ...fields,
});
const seed = {
  "todos/a": todo("Viết báo cáo", 1, { estimate: 2 }),
  "todos/b": todo("Sửa bug đăng nhập", 2, { estimate: 1 }),
  "todos/c": todo("Họp team", 3, { estimate: 1, done: true, doneDate: "2026-10-08" }),
  "todos/r1_2026-10-08": todo("Standup", 4, { estimate: 0.5, routineId: "r1", date: "2026-10-08" }),
  "routines/r1": { text: "Standup", estimate: 0.5, category: "work", days: [1, 2, 3, 4, 5], lastCreated: "2026-10-08" },
};

let app;
let ui;
let page;

before(async () => {
  app = await startApp();
  ui = await openPage(app, { now: at(8, 10), seed });
  page = ui.page;
  await page.evaluate(() => window.__goOnline());
  await wait(100);
});

after(async () => {
  await app?.close();
});

const tags = (id) => page.$$eval(`${ui.li(id)} .tag`, (els) => els.map((e) => `${e.className}: ${e.textContent}`));
const typeHours = async (selector, value) => {
  await ui.selectAll(selector);
  await page.keyboard.type(value);
  await page.keyboard.press("Tab");
  await wait(100);
};

test("estimate uses 0.1h steps without float noise", async () => {
  assert.equal(await ui.text("#hours-total"), "4.5h");
  await ui.clickText("a");
  assert.equal(await page.$eval("#detail-estimate", (el) => el.step), "0.1");
  await typeHours("#detail-estimate", "0.3");
  assert.equal((await ui.get("todos/a")).estimate, 0.3);
  assert.equal(await ui.text(`${ui.li("a")} .estimate`), "0.3h");
  assert.equal(await ui.text("#hours-total"), "2.8h");
});

test("actual hours: badge actual/estimate, red when over, shown in the total", async () => {
  assert.equal(await ui.val("#detail-actual"), "0");
  await typeHours("#detail-actual", "0.5");
  assert.equal((await ui.get("todos/a")).actualSeconds, 1800);
  assert.equal(await ui.text(`${ui.li("a")} .estimate`), "0.5/0.3h");
  assert.ok(await page.$eval(`${ui.li("a")} .estimate`, (el) => el.classList.contains("over")));
  assert.match(await ui.text("#hours-detail"), / · Thực tế 0.5h$/);
  await page.keyboard.press("Escape");
});

test("skip from the list: closed, not counted, marked", async () => {
  await ui.click(`${ui.li("b")} .row-action.skip`);
  const b = await ui.get("todos/b");
  assert.equal(b.done, true);
  assert.equal(b.skipped, true);
  assert.equal(b.doneDate, "2026-10-08");
  assert.deepEqual(await tags("b"), ["tag: Bỏ qua"]);
  assert.ok(await page.$eval(ui.li("b"), (el) => el.classList.contains("skipped")));
  assert.equal(await page.$eval(`${ui.li("b")} input[type=checkbox]`, (el) => el.checked), false);
  assert.equal(await page.$(`${ui.li("b")} .row-action.skip`), null);
  assert.equal(await ui.text("#hours-total"), "1.8h");
  assert.equal(await ui.text("#count"), "Còn 2 / 3 việc · 1 bỏ qua");
});

test("undo a skip in the panel", async () => {
  await ui.clickText("b");
  assert.equal(await ui.text("#detail-skip"), "Hủy bỏ qua");
  await ui.click("#detail-skip");
  const b = await ui.get("todos/b");
  assert.equal(b.done, false);
  assert.equal(b.skipped, false);
  assert.equal(b.doneDate, null);
  assert.equal(await ui.text("#detail-skip"), "Bỏ qua");
  assert.equal(await ui.text("#hours-total"), "2.8h");
});

test("ticking a skipped todo marks it done", async () => {
  await ui.click("#detail-skip");
  assert.equal((await ui.get("todos/b")).skipped, true);
  await ui.click(`${ui.li("b")} input[type=checkbox]`);
  const b = await ui.get("todos/b");
  assert.equal(b.done, true);
  assert.equal(b.skipped, false);
  assert.ok(await page.$eval(ui.li("b"), (el) => el.classList.contains("done")));
  // Skip it again for the next tests
  await ui.click("#detail-skip");
  assert.equal((await ui.get("todos/b")).skipped, true);
  await page.keyboard.press("Escape");
});

test("next day: skipped todos are not carried over, routines come back", async () => {
  await ui.click(`${ui.li("r1_2026-10-08")} .row-action.skip`);
  assert.equal((await ui.get("todos/r1_2026-10-08")).skipped, true);
  await ui.refreshClock(at(9, 9, 30)); // Friday
  const ids = await ui.ids();
  assert.ok(!ids.includes("b"));
  assert.ok(ids.includes("a"));
  assert.ok(ids.includes("r1_2026-10-09"));
});

test("history shows skipped todos apart from done ones", async () => {
  await ui.click("#prev-day");
  await wait(50);
  assert.equal(await ui.text("#day-label"), "Thứ 5, 08/10");
  const texts = await ui.texts();
  assert.ok(texts.includes("Sửa bug đăng nhậpBỏ qua"));
  assert.ok(texts.includes("StandupT2–T6Bỏ qua"));
  assert.equal(await ui.text("#hours-total"), "1h");
  assert.equal(await ui.text("#count"), "Xong 1 / 1 việc · 2 bỏ qua");
});

test("no page errors", () => {
  assert.deepEqual(ui.errors, []);
});
