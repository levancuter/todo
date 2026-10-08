// Work hours, detail panel and drag-and-drop. Steps run in order on one page.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { at, openPage, startApp, wait } from "./helpers.js";

const created = at(8, 9);
const seed = {
  "todos/a": { text: "Việc cũ không có giờ", done: false, order: 1, createdAt: created },
  "todos/b": { text: "Viết báo cáo", done: false, order: 2, createdAt: created, estimate: 2, note: "ghi chú cũ" },
  "todos/c": { text: "Họp team", done: true, doneDate: "2026-10-08", order: 3, createdAt: created, estimate: 1, note: "" },
};

let app;
let ui;
let page;

before(async () => {
  app = await startApp();
  ui = await openPage(app, { now: at(8, 10), seed });
  page = ui.page;
  // "all" tab: hours bar without the work-time part
  await ui.tab("all");
});

after(async () => {
  await app?.close();
});

test("hour badges and total bar; old todo counts as 3h", async () => {
  assert.equal(await ui.text("#hours"), "Tổng 6h · Còn 5h · Xong 1h");
  assert.deepEqual(await page.$$eval(".estimate", (els) => els.map((e) => e.textContent)), ["3h", "2h", "1h"]);
});

test("list checkbox toggles without opening the panel", async () => {
  await ui.click(`${ui.li("c")} input[type=checkbox]`);
  assert.equal(await ui.panelOpen(), false);
  assert.equal((await ui.get("todos/c")).done, false);
  assert.equal(await ui.text("#hours"), "Tổng 6h · Còn 6h · Xong 0h");
  await ui.click(`${ui.li("c")} input[type=checkbox]`);
});

test("click text opens the panel with data, item highlighted", async () => {
  await ui.clickText("b");
  assert.equal(await ui.panelOpen(), true);
  assert.equal(await ui.val("#detail-text"), "Viết báo cáo");
  assert.equal(await ui.val("#detail-estimate"), "2");
  assert.equal(await ui.val("#detail-note"), "ghi chú cũ");
  assert.ok(await page.$eval(ui.li("b"), (el) => el.classList.contains("selected")));
  assert.ok(await page.$eval("body", (el) => el.classList.contains("detail-open")));
  assert.match(await ui.text("#detail-created"), /^Tạo ngày \d+\/\d+\/\d{4}$/);
});

test("note autosaves once after typing stops", async () => {
  const before = (await ui.writes()).length;
  await page.click("#detail-note");
  await page.keyboard.press("End");
  await page.keyboard.type(" thêm");
  await wait(200);
  assert.equal(await ui.text("#detail-status"), "Đang lưu...");
  assert.equal((await ui.writes()).length, before);
  await wait(500);
  assert.equal((await ui.get("todos/b")).note, "ghi chú cũ thêm");
  assert.equal((await ui.writes()).length, before + 1);
  assert.equal(await ui.text("#detail-status"), "Đã lưu");
});

test("remote update refreshes other fields, not the focused one", async () => {
  await page.keyboard.type("!");
  await page.evaluate(() =>
    window.__remote((store, U) => {
      store.get(U + "todos/b").text = "Tên đổi từ máy khác";
    }),
  );
  await wait(50);
  assert.equal(await ui.val("#detail-note"), "ghi chú cũ thêm!");
  assert.equal(await ui.val("#detail-text"), "Tên đổi từ máy khác");
  await wait(600);
});

test("estimate edit saves and updates badge and total", async () => {
  await ui.selectAll("#detail-estimate");
  await page.keyboard.type("4");
  await wait(600);
  assert.equal((await ui.get("todos/b")).estimate, 4);
  assert.equal(await ui.text("#hours"), "Tổng 8h · Còn 7h · Xong 1h");
  assert.equal(await ui.text(`${ui.li("b")} .estimate`), "4h");
});

test("empty title or estimate is not saved and is restored on blur", async () => {
  const before = (await ui.writes()).length;
  await ui.selectAll("#detail-estimate");
  await page.keyboard.press("Backspace");
  await ui.selectAll("#detail-text");
  await page.keyboard.press("Backspace");
  await page.click("#detail-note");
  await wait(600);
  assert.equal(await ui.val("#detail-estimate"), "4");
  assert.equal(await ui.val("#detail-text"), "Tên đổi từ máy khác");
  assert.equal((await ui.writes()).length, before);
});

test("switching task saves the pending edit to the previous task", async () => {
  await page.keyboard.type("?");
  await ui.clickText("a");
  assert.equal((await ui.get("todos/b")).note, "ghi chú cũ thêm!?");
  assert.equal(await ui.val("#detail-text"), "Việc cũ không có giờ");
  assert.equal(await ui.val("#detail-estimate"), "3");
  assert.equal(await ui.val("#detail-note"), "");
  assert.equal(await ui.text("#detail-status"), "");
});

test("list checkbox click while editing in the panel is not lost", async () => {
  await page.click("#detail-note");
  await page.keyboard.type("y");
  await ui.click(`${ui.li("c")} input[type=checkbox]`);
  assert.equal((await ui.get("todos/a")).note, "y");
  assert.equal((await ui.get("todos/c")).done, false);
  await ui.click(`${ui.li("c")} input[type=checkbox]`);
  assert.equal((await ui.get("todos/c")).done, true);
  await page.click("#detail-note");
  await page.keyboard.press("Backspace");
  await ui.clickText("b");
  await ui.clickText("a");
  assert.equal(await ui.val("#detail-note"), "");
  assert.equal((await ui.get("todos/a")).note, "");
});

test("clicking the open task again closes the panel", async () => {
  await ui.clickText("a");
  assert.equal(await ui.panelOpen(), false);
  assert.ok(!(await page.$eval("body", (el) => el.classList.contains("detail-open"))));
});

test("Esc closes the panel and saves the pending edit", async () => {
  await ui.clickText("a");
  await page.click("#detail-note");
  await page.keyboard.type("note A");
  await page.keyboard.press("Escape");
  await wait(50);
  assert.equal(await ui.panelOpen(), false);
  assert.equal((await ui.get("todos/a")).note, "note A");
});

test("close button closes the panel", async () => {
  await ui.clickText("a");
  await ui.click("#detail-close");
  assert.equal(await ui.panelOpen(), false);
});

test("panel checkbox marks done and the panel stays open", async () => {
  await ui.clickText("a");
  await ui.click("#detail-done");
  assert.equal((await ui.get("todos/a")).done, true);
  assert.ok(await page.$eval(ui.li("a"), (el) => el.classList.contains("done")));
  assert.equal(await ui.panelOpen(), true);
});

test("remote delete closes the panel without errors", async () => {
  await page.click("#detail-note");
  await page.keyboard.type(" x");
  await page.evaluate(() => window.__remote((store, U) => store.delete(U + "todos/a")));
  await wait(700);
  assert.equal(await ui.panelOpen(), false);
  assert.equal(await ui.hidden("#status"), true);
});

test("delete button removes the task and closes the panel", async () => {
  await ui.clickText("c");
  await ui.click("#detail-delete");
  assert.equal(await ui.get("todos/c"), undefined);
  assert.equal(await ui.panelOpen(), false);
});

test("new todo defaults to 3h and an empty note", async () => {
  await page.type("#new-todo", "Việc mới\n");
  await wait(50);
  const added = (await ui.writes()).find((w) => w[0] === "set" && w[2].text === "Việc mới")[2];
  assert.equal(added.estimate, 3);
  assert.equal(added.note, "");
  assert.equal(await ui.text("#hours"), "Tổng 7h · Còn 7h · Xong 0h");
});

test("mobile: panel covers the full width, no horizontal scroll", async () => {
  await page.setViewport({ width: 390, height: 800 });
  await ui.click("#todo-list li:last-child .text");
  assert.equal(await page.$eval("#detail", (el) => el.getBoundingClientRect().width), 390);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
  await ui.click("#detail-close");
  await page.setViewport({ width: 1280, height: 800 });
});

test("drag-and-drop reorders and does not open the panel", async () => {
  const box = await (await page.$(`${ui.li("b")} .handle`)).boundingBox();
  await page.mouse.move(box.x + 5, box.y + 5);
  await page.mouse.down();
  for (let y = 0; y <= 80; y += 10) await page.mouse.move(box.x + 5, box.y + 5 + y);
  await page.mouse.up();
  await wait(300);
  const ids = await ui.ids();
  assert.equal(ids[ids.length - 1], "b");
  assert.equal(await ui.panelOpen(), false);
});

test("no page errors", () => {
  assert.deepEqual(ui.errors, []);
});
