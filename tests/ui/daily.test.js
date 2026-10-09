// Work/Life tabs, daily view, history and routines. Steps run in order on one page.
// Clock starts on Thursday 2026-10-08 10:00 (work time).
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { at, openPage, startApp, wait } from "./helpers.js";

const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];
const seed = {
  "todos/a": { text: "Việc cũ không loại", done: false, order: 1, createdAt: at(6, 10) },
  "todos/b": { text: "Đi chợ", done: false, order: 2, createdAt: at(8, 1), estimate: 1, note: "", category: "life" },
  // v2 data: done but no doneDate
  "todos/c": { text: "Họp team v2", done: true, order: 3, createdAt: at(7, 10), estimate: 1, note: "" },
  "todos/d": { text: "Review code", done: true, doneDate: "2026-10-08", order: 4, createdAt: at(8, 2), estimate: 2, category: "work" },
  // Yesterday's routine todo, left unfinished
  "todos/r1_2026-10-07": {
    text: "Tập thể dục",
    done: false,
    doneDate: null,
    order: 5,
    createdAt: at(7, 10),
    estimate: 1,
    note: "",
    category: "life",
    routineId: "r1",
    date: "2026-10-07",
  },
  "routines/r1": { text: "Tập thể dục", estimate: 1, category: "life", days: EVERY_DAY, lastCreated: "2026-10-07" },
  "routines/r2": { text: "Daily standup", estimate: 0.5, category: "work", days: [1, 2, 3, 4, 5], lastCreated: "2026-10-07" },
  "routines/r3": { text: "Đọc sách", estimate: 2, category: "life", days: [6], lastCreated: "2026-10-03" },
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

const activeTab = () => page.$eval("#tabs .active", (el) => el.dataset.tab);
const added = async (text) => (await ui.writes()).find((w) => w[0] === "set" && w[2].text === text)[2];

test("work time opens the Công việc tab; no routine todos from cache", async () => {
  assert.equal(await activeTab(), "work");
  assert.equal(await ui.text("#day-label"), "Hôm nay · 08/10");
  assert.equal(await ui.get("todos/r1_2026-10-08"), undefined);
  assert.equal(await ui.get("todos/r2_2026-10-08"), undefined);
});

test("with server data, due routine todos are created once", async () => {
  await page.evaluate(() => window.__goOnline());
  await wait(100);
  assert.equal((await ui.get("todos/r1_2026-10-08")).text, "Tập thể dục");
  assert.equal((await ui.get("todos/r1_2026-10-08")).date, "2026-10-08");
  assert.equal((await ui.get("todos/r2_2026-10-08")).category, "work");
  assert.equal(await ui.get("todos/r3_2026-10-08"), undefined); // Saturday only
  assert.equal((await ui.get("routines/r1")).lastCreated, "2026-10-08");
  const creates = (await ui.writes()).filter((w) => w[0] === "set" && w[1].startsWith("todos/r"));
  assert.equal(creates.length, 2);
});

test("v2 done todos get doneDate from createdAt, once", async () => {
  assert.equal((await ui.get("todos/c")).doneDate, "2026-10-07");
  assert.equal((await ui.get("meta/app")).migratedV3, true);
});

test("work tab: carried label, routine icon, hours and work time left", async () => {
  assert.deepEqual(await ui.ids(), ["a", "d", "r2_2026-10-08"]);
  const texts = await ui.texts();
  assert.match(texts[0], /Việc cũ không loại\s*từ 06\/10/);
  assert.match(texts[2], /^🔁 Daily standup/);
  assert.equal(await ui.text("#hours"), "Tổng 5.5h · Còn 3.5h · Xong 2h · Giờ làm còn 7h");
  assert.equal(await page.$("#hours .warn"), null);
});

test("life tab: only today's routine todo, no work-time part", async () => {
  await ui.tab("life");
  assert.deepEqual(await ui.ids(), ["b", "r1_2026-10-08"]);
  assert.equal(await ui.text("#hours"), "Tổng 2h · Còn 2h · Xong 0h");
});

test("all tab: every todo with a category dot", async () => {
  await ui.tab("all");
  assert.equal((await ui.ids()).length, 5);
  assert.deepEqual(await page.$$eval("#todo-list .dot", (els) => els.map((e) => e.className)), [
    "dot work",
    "dot life",
    "dot work",
    "dot life",
    "dot work",
  ]);
});

test("new todo takes the tab's category; the all tab follows the clock", async () => {
  await page.type("#new-todo", "Mua sữa\n");
  await wait(50);
  assert.equal((await added("Mua sữa")).category, "work"); // Thursday 10:00
  await ui.tab("life");
  await page.type("#new-todo", "Gọi mẹ\n");
  await wait(50);
  const todo = await added("Gọi mẹ");
  assert.equal(todo.category, "life");
  assert.equal(todo.estimate, 3);
  assert.equal(todo.doneDate, null);
});

test("warning when remaining work is more than work hours left", async () => {
  await ui.tab("work");
  await ui.clickText("a");
  await ui.selectAll("#detail-estimate");
  await page.keyboard.type("10");
  await page.keyboard.press("Tab");
  await page.waitForSelector("#hours .warn", { timeout: 2000 });
  assert.match(await ui.text("#hours .warn"), /⚠ Giờ làm còn 7h/);
});

test("category change in the panel moves the todo to the other tab", async () => {
  await page.select("#detail-category", "life");
  await wait(50);
  assert.equal((await ui.get("todos/a")).category, "life");
  assert.ok(!(await ui.ids()).includes("a"));
  assert.equal(await ui.panelOpen(), true);
  await page.select("#detail-category", "work");
  await wait(50);
});

test("tick writes doneDate, untick clears it", async () => {
  await ui.click(`${ui.li("a")} input[type=checkbox]`);
  assert.equal((await ui.get("todos/a")).doneDate, "2026-10-08");
  assert.equal(await ui.panelOpen(), true);
  await ui.click(`${ui.li("a")} input[type=checkbox]`);
  assert.equal((await ui.get("todos/a")).doneDate, null);
  await page.keyboard.press("Escape");
});

test("repeat: start daily, pick days, weekdays, stop", async () => {
  await ui.tab("life");
  await ui.clickText("b");
  assert.equal(await ui.val("#detail-repeat"), "none");
  assert.equal(await ui.hidden("#detail-days"), true);

  await page.select("#detail-repeat", "daily");
  await wait(50);
  const routineId = (await ui.get("todos/b")).routineId;
  assert.ok(routineId);
  assert.equal((await ui.get("todos/b")).date, "2026-10-08");
  const routine = await ui.get("routines/" + routineId);
  assert.deepEqual(routine.days, EVERY_DAY);
  assert.equal(routine.lastCreated, "2026-10-08");
  assert.equal(routine.category, "life");
  assert.equal(await ui.val("#detail-repeat"), "daily");
  assert.match((await ui.texts())[0], /^🔁 Đi chợ/);

  await page.select("#detail-repeat", "custom");
  await wait(30);
  assert.equal(await ui.hidden("#detail-days"), false);
  await ui.click('#detail-days button[data-day="0"]');
  assert.deepEqual((await ui.get("routines/" + routineId)).days, [1, 2, 3, 4, 5, 6]);
  assert.equal(await ui.val("#detail-repeat"), "custom");
  const pressed = (day) => page.$eval(`#detail-days button[data-day="${day}"]`, (el) => el.getAttribute("aria-pressed"));
  assert.equal(await pressed(0), "false");
  assert.equal(await pressed(1), "true");

  await page.select("#detail-repeat", "weekdays");
  await wait(50);
  assert.deepEqual((await ui.get("routines/" + routineId)).days, [1, 2, 3, 4, 5]);

  await page.select("#detail-repeat", "none");
  await wait(50);
  assert.equal(await ui.get("routines/" + routineId), undefined);
  assert.equal((await ui.get("todos/b")).routineId, null);
  assert.equal(await ui.val("#detail-repeat"), "none");
});

test("editing today's routine todo also updates the routine", async () => {
  await ui.clickText("r1_2026-10-08");
  assert.equal(await ui.val("#detail-repeat"), "daily");
  await page.click("#detail-text");
  await page.keyboard.press("End");
  await page.keyboard.type(" 30p");
  await wait(700);
  assert.equal((await ui.get("todos/r1_2026-10-08")).text, "Tập thể dục 30p");
  assert.equal((await ui.get("routines/r1")).text, "Tập thể dục 30p");
  await page.keyboard.press("Escape");
});

test("a deleted routine todo is not recreated the same day", async () => {
  await ui.tab("work");
  await ui.click(`${ui.li("r2_2026-10-08")} .delete`);
  await ui.refreshClock(at(8, 10, 5));
  assert.equal(await ui.get("todos/r2_2026-10-08"), undefined);
});

test("history: read-only view of yesterday with the unfinished routine", async () => {
  await ui.tab("all");
  await ui.click("#prev-day");
  await wait(50);
  assert.equal(await ui.text("#day-label"), "07/10");
  assert.equal(await ui.hidden("#add-form"), true);
  const texts = await ui.texts();
  assert.equal(texts.length, 2);
  assert.ok(texts.some((t) => t.includes("Họp team v2")));
  assert.ok(texts.some((t) => t.includes("Tập thể dục") && t.includes("chưa xong")));
  assert.equal(await ui.text("#hours"), "Xong 1h · Chưa xong 1h");
  assert.equal(await ui.text("#count"), "Xong 1 / 2 việc");
  assert.equal(await page.$$eval("#todo-list .handle, #todo-list .delete", (els) => els.length), 0);
  assert.ok(await page.$$eval("#todo-list input", (els) => els.every((e) => e.disabled)));
  await ui.click("#todo-list li .text");
  assert.equal(await ui.panelOpen(), false);

  await ui.click("#next-day");
  assert.equal(await ui.text("#day-label"), "Hôm nay · 08/10");
  assert.equal(await ui.hidden("#add-form"), false);
  assert.equal(await page.$eval("#next-day", (el) => el.disabled), true);
});

test("next day: routines recreated, yesterday's done and routine todos gone", async () => {
  await ui.refreshClock(at(9, 9, 30)); // Friday
  assert.equal(await ui.text("#day-label"), "Hôm nay · 09/10");
  assert.ok(await ui.get("todos/r1_2026-10-09"));
  assert.ok(await ui.get("todos/r2_2026-10-09"));
  assert.equal((await ui.get("todos/r1_2026-10-09")).text, "Tập thể dục 30p");
  assert.ok(!(await ui.ids()).includes("d")); // done on 08/10
  assert.ok((await ui.ids()).includes("a"));
  await ui.tab("life");
  assert.ok(!(await ui.ids()).includes("r1_2026-10-08"));
  assert.ok((await ui.ids()).includes("r1_2026-10-09"));
});

test("weekend: no work routine, Saturday routine created, 0h work left", async () => {
  await ui.refreshClock(at(10, 9, 30)); // Saturday
  assert.equal(await ui.get("todos/r2_2026-10-10"), undefined);
  assert.ok(await ui.get("todos/r3_2026-10-10"));
  await ui.tab("work");
  assert.match(await ui.text("#hours"), /Giờ làm còn 0h$/);
});

test("mobile: no horizontal scroll", async () => {
  await page.setViewport({ width: 390, height: 800 });
  await ui.tab("all");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
});

test("no page errors", () => {
  assert.deepEqual(ui.errors, []);
});

test("outside work hours (evening, lunch) the Cuộc sống tab opens", async () => {
  for (const now of [at(8, 20), at(8, 12, 30)]) {
    const other = await openPage(app, { now, seed: {} });
    assert.equal(await other.page.$eval("#tabs .active", (el) => el.dataset.tab), "life");
    assert.deepEqual(other.errors, []);
    await other.page.close();
  }
});
