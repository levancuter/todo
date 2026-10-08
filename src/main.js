import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { hideDetail, initDetail, showDetail } from "./detail.js";
import { isDragging, makeSortable } from "./drag.js";
import { auth, googleProvider } from "./firebase.js";
import { estimateOf, formatHours, sumHours } from "./hours.js";
import { orderBetween, sortTodos } from "./order.js";
import { addTodo, removeTodo, setDone, setOrder, updateTodo, watchTodos } from "./todos.js";

const $ = (id) => document.getElementById(id);

const status = $("status");
const loginView = $("login-view");
const todoView = $("todo-view");
const userBox = $("user");
const form = $("add-form");
const input = $("new-todo");
const list = $("todo-list");
const empty = $("empty");
const count = $("count");
const hours = $("hours");

let uid = null;
let unsubscribe = null;
let todos = [];
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
  addTodo(uid, text).catch(showError);
});

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

initDetail({
  onSave: (id, fields) => updateTodo(uid, id, fields),
  onDone: (id, done) => setDone(uid, id, done).catch(showError),
  onDelete: (id) => removeTodo(uid, id).catch(showError),
  onClose: () => select(null),
  onError: showError,
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && selectedId) select(null);
});

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
    setDone(uid, todo.id, checkbox.checked).catch(showError);
  });

  const text = document.createElement("span");
  text.className = "text";
  text.textContent = todo.text;
  text.addEventListener("click", () => select(todo.id === selectedId ? null : todo.id));

  const estimate = document.createElement("span");
  estimate.className = "estimate";
  estimate.textContent = formatHours(estimateOf(todo));

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

function render(next) {
  todos = next;
  // Don't rebuild the list mid-drag or mid-click; it renders again afterwards
  if (isDragging() || pressed) return;
  list.replaceChildren(...todos.map(renderTodo));
  empty.hidden = todos.length > 0;
  const left = todos.filter((t) => !t.done).length;
  count.textContent = todos.length ? `Còn ${left} / ${todos.length} việc` : "";
  const h = sumHours(todos);
  hours.textContent = `Tổng ${formatHours(h.total)} · Còn ${formatHours(h.left)} · Xong ${formatHours(h.done)}`;
  renderDetail();
}

function renderDetail() {
  const todo = todos.find((t) => t.id === selectedId);
  if (todo) {
    showDetail(todo);
    return;
  }
  // The open todo was deleted: drop its unsaved edits
  hideDetail(selectedId !== null);
  selectedId = null;
}

onAuthStateChanged(auth, (user) => {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }

  uid = user ? user.uid : null;
  status.hidden = true;
  loginView.hidden = !!user;
  todoView.hidden = !user;
  userBox.hidden = !user;

  if (user) {
    $("user-name").textContent = user.displayName;
    unsubscribe = watchTodos(uid, render, showError);
    input.focus();
  } else {
    selectedId = null;
    hideDetail(true);
    list.replaceChildren();
  }
});
