import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "./firebase.js";
import { orderBetween } from "./order.js";
import { addTodo, removeTodo, setDone, setOrder, watchTodos } from "./todos.js";

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

let uid = null;
let unsubscribe = null;
let todos = [];
let dragging = null;

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

function startDrag(e, li, id) {
  e.preventDefault();
  const handle = e.currentTarget;
  handle.setPointerCapture(e.pointerId);
  li.classList.add("dragging");
  dragging = { li, id, handle };
  handle.addEventListener("pointermove", onDragMove);
  handle.addEventListener("pointerup", endDrag);
  handle.addEventListener("pointercancel", endDrag);
}

function onDragMove(e) {
  const { li } = dragging;
  // Insert before the first item whose middle is below the pointer
  const next = [...list.children].find((el) => {
    if (el === li) return false;
    const r = el.getBoundingClientRect();
    return e.clientY < r.top + r.height / 2;
  });
  list.insertBefore(li, next || null);
}

function endDrag() {
  const { li, id, handle } = dragging;
  handle.removeEventListener("pointermove", onDragMove);
  handle.removeEventListener("pointerup", endDrag);
  handle.removeEventListener("pointercancel", endDrag);
  li.classList.remove("dragging");
  dragging = null;

  const ids = [...list.children].map((el) => el.dataset.id);
  const index = ids.indexOf(id);
  if (todos[index] && todos[index].id === id) {
    render(todos);
    return;
  }

  const find = (x) => todos.find((t) => t.id === x);
  const order = orderBetween(find(ids[index - 1]), find(ids[index + 1]));
  setOrder(uid, id, order).catch((err) => {
    showError(err);
    render(todos);
  });
}

function renderTodo(todo) {
  const li = document.createElement("li");
  li.className = todo.done ? "done" : "";
  li.dataset.id = todo.id;

  const handle = document.createElement("span");
  handle.className = "handle";
  handle.textContent = "⋮⋮";
  handle.title = "Kéo để sắp xếp";
  handle.addEventListener("pointerdown", (e) => startDrag(e, li, todo.id));

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = todo.done;
  checkbox.addEventListener("change", () => {
    setDone(uid, todo.id, checkbox.checked).catch(showError);
  });

  const text = document.createElement("span");
  text.className = "text";
  text.textContent = todo.text;

  const del = document.createElement("button");
  del.className = "delete";
  del.textContent = "✕";
  del.title = "Xóa";
  del.addEventListener("click", () => {
    removeTodo(uid, todo.id).catch(showError);
  });

  li.append(handle, checkbox, text, del);
  return li;
}

function render(next) {
  todos = next;
  // Don't rebuild the list mid-drag; endDrag or the next snapshot will render
  if (dragging) return;
  list.replaceChildren(...todos.map(renderTodo));
  empty.hidden = todos.length > 0;
  const left = todos.filter((t) => !t.done).length;
  count.textContent = todos.length ? `Còn ${left} / ${todos.length} việc` : "";
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
    list.replaceChildren();
  }
});
