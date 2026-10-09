import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { categoryOf, isWorkTime, workHoursLeft } from "./category.js";
import { carriedFrom, deadlineStatus, historyTodos, todayTodos } from "./daily.js";
import { addDays, dayKey, formatDay } from "./dates.js";
import { hideDetail, initDetail, showDetail } from "./detail.js";
import { isDragging, makeSortable } from "./drag.js";
import { auth, googleProvider } from "./firebase.js";
import { estimateOf, formatHours, sumHours } from "./hours.js";
import { orderBetween, sortTodos } from "./order.js";
import { dueRoutines } from "./routines.js";
import {
  addTodo,
  createRoutineTodo,
  loadDay,
  migrateV3,
  removeTodo,
  setDone,
  setOrder,
  startRoutine,
  stopRoutine,
  updateRoutine,
  updateTodo,
  watchRoutines,
  watchTodos,
} from "./todos.js";

const $ = (id) => document.getElementById(id);

const status = $("status");
const loginView = $("login-view");
const todoView = $("todo-view");
const userBox = $("user");
const tabs = $("tabs");
const dayLabel = $("day-label");
const prevDay = $("prev-day");
const nextDay = $("next-day");
const form = $("add-form");
const input = $("new-todo");
const list = $("todo-list");
const empty = $("empty");
const count = $("count");
const hours = $("hours");

const ROUTINE_FIELDS = ["text", "estimate", "category"];

let uid = null;
let unwatchTodos = null;
let unwatchRoutines = null;
let todos = []; // open todos + todos done today
let routines = [];
let routinesFromServer = false;
const requested = new Set(); // routine todos already created this session
let today = dayKey();
let tab = isWorkTime() ? "work" : "life";
let viewDay = null; // past day shown read-only, null = today
let history = null; // todos of viewDay, null while loading
let selectedId = null;

function showError(err) {
  status.hidden = false;
  status.textContent = "Lỗi: " + err.message;
}

$("login").addEventListener("click", () => {
  signInWithPopup(auth, googleProvider).catch(showError);
});

$("logout").addEventListener("click", () => signOut(auth));

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  const category = tab === "all" ? (isWorkTime() ? "work" : "life") : tab;
  addTodo(uid, text, category).catch(showError);
});

tabs.addEventListener("click", (e) => {
  const button = e.target.closest("button");
  if (!button) return;
  tab = button.dataset.tab;
  render(todos);
});

prevDay.addEventListener("click", () => openDay(addDays(viewDay || today, -1)));
nextDay.addEventListener("click", () => openDay(addDays(viewDay, 1)));

function openDay(day) {
  selectedId = null;
  if (day >= today) {
    viewDay = null;
    render(todos);
    return;
  }
  viewDay = day;
  history = null;
  render(todos);
  loadDay(uid, day).then((result) => {
    if (viewDay !== day) return;
    history = result;
    render(todos);
  }, showError);
}

makeSortable(list, (id, ids) => {
  if (!ids) {
    render(todos);
    return;
  }
  const index = ids.indexOf(id);
  const find = (x) => todos.find((t) => t.id === x);
  const order = orderBetween(find(ids[index - 1]), find(ids[index + 1]));

  // Update the screen right away instead of waiting for Firestore
  render(sortTodos(todos.map((t) => (t.id === id ? { ...t, order } : t))));
  setOrder(uid, id, order).catch(showError);
});

// Rebuilding the list between pointerdown and click would swallow the click
// (e.g. a panel field saves on blur and Firestore sends a new snapshot)
let pressed = false;
list.addEventListener("pointerdown", () => {
  pressed = true;
});
function release() {
  if (!pressed) return;
  pressed = false;
  setTimeout(() => render(todos));
}
window.addEventListener("pointerup", release);
window.addEventListener("pointercancel", release);

function select(id) {
  selectedId = id;
  render(todos);
}

function routineOf(todo) {
  return todo.routineId ? routines.find((r) => r.id === todo.routineId) : undefined;
}

function saveTodo(id, fields) {
  const todo = todos.find((t) => t.id === id);
  const routine = todo && routineOf(todo);
  // Editing today's routine todo also changes the routine for next time
  if (routine && todo.date === today) {
    const shared = Object.fromEntries(Object.entries(fields).filter(([k]) => ROUTINE_FIELDS.includes(k)));
    if (Object.keys(shared).length) updateRoutine(uid, routine.id, shared).catch(showError);
  }
  return updateTodo(uid, id, fields);
}

function setRepeat(id, days) {
  const todo = todos.find((t) => t.id === id);
  if (!todo) return;
  const routine = routineOf(todo);
  let saving = null;
  if (!days) {
    if (todo.routineId) saving = stopRoutine(uid, todo);
  } else if (routine) {
    saving = updateRoutine(uid, routine.id, { days });
  } else {
    saving = startRoutine(uid, todo, days, today);
  }
  if (saving) saving.catch(showError);
}

initDetail({
  onSave: saveTodo,
  onDone: (id, done) => setDone(uid, id, done, today).catch(showError),
  onRepeat: setRepeat,
  onDelete: (id) => removeTodo(uid, id).catch(showError),
  onClose: () => select(null),
  onError: showError,
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && selectedId) select(null);
});

function tag(text, className = "tag") {
  const span = document.createElement("span");
  span.className = className;
  span.textContent = text;
  return span;
}

// Text, labels and hours shared by today's list and the history list
function todoInfo(todo) {
  const text = document.createElement("span");
  text.className = "text";
  if (tab === "all") text.append(tag("", "dot " + categoryOf(todo)));
  text.append((todo.routineId ? "🔁 " : "") + todo.text);

  const estimate = tag(formatHours(estimateOf(todo)), "estimate");
  return { text, estimate };
}

function deadlineTag(todo) {
  const status = deadlineStatus(todo, today);
  if (status === "overdue") return tag("quá hạn " + formatDay(todo.deadline), "tag missed");
  if (status === "today") return tag("hạn hôm nay", "tag due");
  if (status === "upcoming") return tag("hạn " + formatDay(todo.deadline));
  return null;
}

function renderTodo(todo) {
  const li = document.createElement("li");
  li.classList.toggle("done", todo.done);
  li.classList.toggle("selected", todo.id === selectedId);
  li.dataset.id = todo.id;

  const handle = document.createElement("span");
  handle.className = "handle";
  handle.textContent = "⋮⋮";
  handle.title = "Kéo để sắp xếp";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = todo.done;
  checkbox.addEventListener("change", () => {
    setDone(uid, todo.id, checkbox.checked, today).catch(showError);
  });

  const { text, estimate } = todoInfo(todo);
  text.addEventListener("click", () => select(todo.id === selectedId ? null : todo.id));
  const from = carriedFrom(todo, today);
  if (from) text.append(tag("từ " + formatDay(from)));
  const deadline = deadlineTag(todo);
  if (deadline) text.append(deadline);

  const del = document.createElement("button");
  del.className = "delete";
  del.textContent = "✕";
  del.title = "Xóa";
  del.addEventListener("click", () => {
    removeTodo(uid, todo.id).catch(showError);
  });

  li.append(handle, checkbox, text, estimate, del);
  return li;
}

function renderHistoryTodo(todo) {
  const li = document.createElement("li");
  li.className = todo.done ? "done readonly" : "readonly";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = todo.done;
  checkbox.disabled = true;

  const { text, estimate } = todoInfo(todo);
  if (!todo.done) text.append(tag("chưa xong", "tag missed"));

  li.append(checkbox, text, estimate);
  return li;
}

function byTab(items) {
  return tab === "all" ? items : items.filter((t) => categoryOf(t) === tab);
}

function render(next) {
  todos = next;
  // Don't rebuild the list mid-drag or mid-click; it renders again afterwards
  if (isDragging() || pressed) return;

  for (const button of tabs.children) {
    button.classList.toggle("active", button.dataset.tab === tab);
  }
  dayLabel.textContent = viewDay ? formatDay(viewDay) : `Hôm nay · ${formatDay(today)}`;
  nextDay.disabled = !viewDay;
  form.hidden = !!viewDay;

  if (viewDay) renderHistory();
  else renderToday();
  renderDetail();
}

function renderToday() {
  const shown = byTab(todayTodos(todos, today));
  list.replaceChildren(...shown.map(renderTodo));
  empty.textContent = "Chưa có việc nào.";
  empty.hidden = shown.length > 0;
  const left = shown.filter((t) => !t.done).length;
  count.textContent = shown.length ? `Còn ${left} / ${shown.length} việc` : "";

  const h = sumHours(shown);
  hours.replaceChildren(`Tổng ${formatHours(h.total)} · Còn ${formatHours(h.left)} · Xong ${formatHours(h.done)}`);
  if (tab === "work") {
    const workLeft = workHoursLeft();
    const late = h.left > workLeft;
    const text = `${late ? "⚠ " : ""}Giờ làm còn ${formatHours(Math.floor(workLeft * 2) / 2)}`;
    hours.append(" · ", tag(text, late ? "warn" : ""));
  }
}

function renderHistory() {
  if (!history) {
    list.replaceChildren();
    empty.textContent = "Đang tải...";
    empty.hidden = false;
    hours.textContent = "";
    count.textContent = "";
    return;
  }
  const shown = byTab(historyTodos(history, viewDay));
  list.replaceChildren(...shown.map(renderHistoryTodo));
  empty.textContent = "Không có việc nào.";
  empty.hidden = shown.length > 0;
  const h = sumHours(shown);
  hours.textContent = `Xong ${formatHours(h.done)} · Chưa xong ${formatHours(h.left)}`;
  const done = shown.filter((t) => t.done).length;
  count.textContent = shown.length ? `Xong ${done} / ${shown.length} việc` : "";
}

function renderDetail() {
  const todo = viewDay ? null : todayTodos(todos, today).find((t) => t.id === selectedId);
  if (todo) {
    showDetail(todo, routineOf(todo));
    return;
  }
  // The open todo was deleted: drop its unsaved edits
  hideDetail(selectedId !== null);
  selectedId = null;
}

// Only trust routines read from the server: a stale cache could recreate
// a todo that another device already created and the user changed
function createDueRoutineTodos() {
  if (!routinesFromServer) return;
  for (const routine of dueRoutines(routines, today)) {
    const key = `${routine.id}_${today}`;
    if (requested.has(key)) continue;
    requested.add(key);
    createRoutineTodo(uid, routine, today).catch(showError);
  }
}

function watchToday() {
  if (unwatchTodos) unwatchTodos();
  unwatchTodos = watchTodos(uid, today, render, showError);
}

// New day: reload today's todos and create routine todos.
// Also refreshes the remaining work hours.
function tick() {
  const now = dayKey();
  if (now !== today) {
    today = now;
    if (uid) {
      watchToday();
      createDueRoutineTodos();
    }
  }
  if (uid) render(todos);
}
setInterval(tick, 60_000);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) tick();
});

onAuthStateChanged(auth, (user) => {
  if (unwatchTodos) unwatchTodos();
  if (unwatchRoutines) unwatchRoutines();
  unwatchTodos = null;
  unwatchRoutines = null;

  uid = user ? user.uid : null;
  status.hidden = true;
  loginView.hidden = !!user;
  todoView.hidden = !user;
  userBox.hidden = !user;
  todos = [];
  routines = [];
  routinesFromServer = false;
  viewDay = null;
  selectedId = null;
  hideDetail(true);

  if (user) {
    $("user-name").textContent = user.displayName;
    today = dayKey();
    // Not critical: if it fails (e.g. offline) it runs again next time
    migrateV3(uid).catch((err) => console.warn("migrateV3", err));
    watchToday();
    unwatchRoutines = watchRoutines(
      uid,
      (result, fromServer) => {
        routines = result;
        routinesFromServer = fromServer;
        createDueRoutineTodos();
        render(todos);
      },
      showError,
    );
    input.focus();
  } else {
    list.replaceChildren();
  }
});
