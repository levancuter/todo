import { estimateOf, parseEstimate } from "./hours.js";

const SAVE_DELAY_MS = 500;

const $ = (id) => document.getElementById(id);

const panel = $("detail");
const doneBox = $("detail-done");
const textInput = $("detail-text");
const estimateInput = $("detail-estimate");
const noteInput = $("detail-note");
const created = $("detail-created");
const saveStatus = $("detail-status");

let handlers = null;
let shown = null; // the open todo, with local edits applied
let pending = {}; // edited fields not yet sent
let timer = null;
let saving = 0;

// handlers: onSave(id, fields) -> Promise, onDone(id, done), onDelete(id), onClose(), onError(err)
export function initDetail(h) {
  handlers = h;

  watch(textInput, "text", () => textInput.value.trim() || null);
  watch(estimateInput, "estimate", () => parseEstimate(estimateInput.value));
  watch(noteInput, "note", () => noteInput.value);

  doneBox.addEventListener("change", () => handlers.onDone(shown.id, doneBox.checked));
  $("detail-delete").addEventListener("click", () => handlers.onDelete(shown.id));
  $("detail-close").addEventListener("click", () => handlers.onClose());
}

export function showDetail(todo) {
  if (shown?.id !== todo.id) {
    flush();
    saveStatus.textContent = "";
  }
  shown = { ...todo, ...pending };
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

function fill() {
  setValue(textInput, shown.text);
  setValue(estimateInput, String(estimateOf(shown)));
  setValue(noteInput, shown.note || "");
  doneBox.checked = shown.done;
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
