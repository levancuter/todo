import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "./firebase.js";
import { addTodo, removeTodo, setDone, watchTodos } from "./todos.js";

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

function renderTodo(todo) {
  const li = document.createElement("li");
  li.className = todo.done ? "done" : "";

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

  li.append(checkbox, text, del);
  return li;
}

function render(todos) {
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
