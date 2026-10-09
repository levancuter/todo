import { categoryOf } from "./category.js";
import { estimateOf, parseEstimate } from "./hours.js";
import { REPEAT_DAILY, REPEAT_WEEKDAYS, repeatMode } from "./routines.js";

const SAVE_DELAY_MS = 500;

const $ = (id) => document.getElementById(id);

const panel = $("detail");
const doneBox = $("detail-done");
const textInput = $("detail-text");
const estimateInput = $("detail-estimate");
const noteInput = $("detail-note");
const categoryInput = $("detail-category");
const deadlineRow = $("detail-deadline-row");
const deadlineInput = $("detail-deadline");
const repeatInput = $("detail-repeat");
const daysBox = $("detail-days");
const created = $("detail-created");
const saveStatus = $("detail-status");

let handlers = null;
let shown = null; // the open todo, with local edits applied
let pending = {}; // edited fields not yet sent
let timer = null;
let saving = 0;
let routine = null; // routine of the open todo, if any
let customPicked = false; // keep the day buttons open after picking "custom"

// handlers: onSave(id, fields) -> Promise, onDone(id, done), onRepeat(id, days | null),
// onDelete(id), onClose(), onError(err)
export function initDetail(h) {
  handlers = h;

  watch(textInput, "text", () => textInput.value.trim() || null);
  watch(estimateInput, "estimate", () => parseEstimate(estimateInput.value));
  watch(noteInput, "note", () => noteInput.value);

  doneBox.addEventListener("change", () => handlers.onDone(shown.id, doneBox.checked));
  categoryInput.addEventListener("change", () => {
    pending.category = categoryInput.value;
    flush();
  });
  deadlineInput.addEventListener("change", () => {
    pending.deadline = deadlineInput.value || null;
    flush();
  });
  repeatInput.addEventListener("change", onRepeatChange);
  daysBox.addEventListener("click", onDayClick);
  $("detail-delete").addEventListener("click", () => handlers.onDelete(shown.id));
  $("detail-close").addEventListener("click", () => handlers.onClose());
}

export function showDetail(todo, todoRoutine) {
  if (shown?.id !== todo.id) {
    flush();
    saveStatus.textContent = "";
    customPicked = false;
  }
  shown = { ...todo, ...pending };
  routine = todoRoutine || null;
  fill();
  panel.hidden = false;
  document.body.classList.add("detail-open");
}

// discard: drop unsaved edits (e.g. the todo was deleted)
export function hideDetail(discard = false) {
  if (discard) {
    clearTimeout(timer);
    pending = {};
  } else {
    flush();
  }
  shown = null;
  routine = null;
  panel.hidden = true;
  document.body.classList.remove("detail-open");
}

function watch(input, field, read) {
  input.addEventListener("input", () => {
    const value = read();
    if (value === null) return;
    pending[field] = value;
    saveStatus.textContent = "Đang lưu...";
    clearTimeout(timer);
    timer = setTimeout(flush, SAVE_DELAY_MS);
  });
  // Save right away and put back the stored value if the input was invalid
  input.addEventListener("blur", () => {
    flush();
    if (shown) fill();
  });
}

function flush() {
  clearTimeout(timer);
  if (!shown || Object.keys(pending).length === 0) return;
  const fields = pending;
  pending = {};
  shown = { ...shown, ...fields };
  saving++;
  handlers
    .onSave(shown.id, fields)
    .then(() => {
      saving--;
      if (saving === 0 && Object.keys(pending).length === 0) saveStatus.textContent = "Đã lưu";
    })
    .catch((err) => {
      saving--;
      saveStatus.textContent = "";
      handlers.onError(err);
    });
}

function onRepeatChange() {
  const mode = repeatInput.value;
  customPicked = mode === "custom";
  if (mode === "none") handlers.onRepeat(shown.id, null);
  if (mode === "daily") handlers.onRepeat(shown.id, REPEAT_DAILY);
  if (mode === "weekdays") handlers.onRepeat(shown.id, REPEAT_WEEKDAYS);
  if (mode === "custom") {
    if (!routine) handlers.onRepeat(shown.id, [new Date().getDay()]);
    fill();
  }
}

function onDayClick(e) {
  const button = e.target.closest("button");
  if (!button) return;
  const day = Number(button.dataset.day);
  const days = routine ? routine.days : [];
  const next = days.includes(day) ? days.filter((d) => d !== day) : [...days, day];
  if (next.length === 0) customPicked = false;
  handlers.onRepeat(shown.id, next.length ? next.sort((a, b) => a - b) : null);
}

function fill() {
  setValue(textInput, shown.text);
  setValue(estimateInput, String(estimateOf(shown)));
  setValue(noteInput, shown.note || "");
  doneBox.checked = shown.done;
  categoryInput.value = categoryOf(shown);
  const days = routine ? routine.days : [];
  const mode = customPicked ? "custom" : repeatMode(days);
  repeatInput.value = mode;
  daysBox.hidden = mode !== "custom";
  // Only one-off todos have a deadline
  deadlineRow.hidden = mode !== "none";
  setValue(deadlineInput, shown.deadline || "");
  for (const button of daysBox.children) {
    button.setAttribute("aria-pressed", days.includes(Number(button.dataset.day)));
  }
  // createdAt is null until the server confirms a new todo
  created.textContent = shown.createdAt
    ? "Tạo ngày " + shown.createdAt.toDate().toLocaleDateString("vi-VN")
    : "";
}

function setValue(input, value) {
  // Don't overwrite what the user is typing
  if (document.activeElement === input || input.value === value) return;
  input.value = value;
}
