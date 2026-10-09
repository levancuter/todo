// Deadlines on one-off todos. Clock starts on Thursday 2026-10-08 10:00.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { at, openPage, startApp, wait } from "./helpers.js";

const created = at(8, 9);
const todo = (text, order, fields = {}) => ({ text, done: false, order, createdAt: created, category: "work", ...fields });
const seed = {
  "todos/a": todo("Không có hạn", 1),
  "todos/b": todo("Quá hạn", 2, { deadline: "2026-10-07" }),
  "todos/c": todo("Hạn hôm nay", 3, { deadline: "2026-10-08" }),
  "todos/d": todo("Hạn sau", 4, { deadline: "2026-10-12" }),
  "todos/e": todo("Xong rồi", 5, { done: true, doneDate: "2026-10-08", deadline: "2026-10-07" }),
  "todos/r1_2026-10-08": todo("Standup", 6, { routineId: "r1", date: "2026-10-08" }),
  "routines/r1": { text: "Standup", estimate: 3, category: "work", days: [1, 2, 3, 4, 5], lastCreated: "2026-10-08" },
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

const tags = (id) => page.$$eval(`${ui.li(id)} .tag`, (els) => els.map((e) => `${e.className}: ${e.textContent}`));
const setDeadline = async (value) => {
  await page.$eval(
    "#detail-deadline",
    (el, v) => {
      // Native setter, like a real date pick: React ignores a plain `el.value = v`
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, v);
      el.dispatchEvent(new Event("change", { bubbles: true }));
    },
    value,
  );
  await wait(50);
};

test("list shows overdue, today and upcoming deadlines; none when done", async () => {
  assert.deepEqual(await tags("a"), []);
  assert.deepEqual(await tags("b"), ["tag missed: Quá hạn 07/10"]);
  assert.deepEqual(await tags("c"), ["tag due: Hạn hôm nay"]);
  assert.deepEqual(await tags("d"), ["tag: Hạn 12/10"]);
  assert.deepEqual(await tags("e"), []);
});

test("set a deadline in the panel", async () => {
  await ui.clickText("a");
  assert.equal(await ui.hidden("#detail-deadline-row"), false);
  assert.equal(await ui.val("#detail-deadline"), "");
  await setDeadline("2026-10-15");
  assert.equal((await ui.get("todos/a")).deadline, "2026-10-15");
  assert.deepEqual(await tags("a"), ["tag: Hạn 15/10"]);
  assert.equal(await ui.text("#detail-status"), "Đã lưu");
});

test("clear the deadline", async () => {
  await setDeadline("");
  assert.equal((await ui.get("todos/a")).deadline, null);
  assert.deepEqual(await tags("a"), []);
});

test("routine todos have no deadline field", async () => {
  await ui.clickText("r1_2026-10-08");
  assert.equal(await ui.val("#detail-repeat"), "weekdays");
  assert.equal(await ui.hidden("#detail-deadline-row"), true);
});

test("turning on repeat clears the deadline", async () => {
  await ui.clickText("d");
  assert.equal(await ui.val("#detail-deadline"), "2026-10-12");
  await page.select("#detail-repeat", "daily");
  await wait(50);
  assert.equal((await ui.get("todos/d")).deadline, null);
  assert.ok((await ui.get("todos/d")).routineId);
  assert.equal(await ui.hidden("#detail-deadline-row"), true);
  assert.deepEqual(await tags("d"), ["tag repeat: Hằng ngày"]);
  await page.keyboard.press("Escape");
});

test("new todos start without a deadline", async () => {
  await page.type("#new-todo", "Việc mới\n");
  await wait(50);
  const added = (await ui.writes()).find((w) => w[0] === "set" && w[2].text === "Việc mới")[2];
  assert.equal(added.deadline, null);
});

test("ticking done hides the deadline tag", async () => {
  await ui.click(`${ui.li("b")} input[type=checkbox]`);
  assert.deepEqual(await tags("b"), []);
});

test("next day: today's deadline becomes overdue", async () => {
  await ui.refreshClock(at(9, 10));
  assert.deepEqual(await tags("c"), ["tag missed: Quá hạn 08/10", "tag: Từ 08/10"]);
});

test("no page errors", () => {
  assert.deepEqual(ui.errors, []);
});
