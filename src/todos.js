import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase.js";
import { sortTodos } from "./order.js";

function todosRef(uid) {
  return collection(db, "users", uid, "todos");
}

// Sorted on the client so old todos without `order` are still included
export function watchTodos(uid, callback, onError) {
  return onSnapshot(
    todosRef(uid),
    (snap) => callback(sortTodos(snap.docs.map((d) => ({ id: d.id, ...d.data() })))),
    onError,
  );
}

export function addTodo(uid, text) {
  return addDoc(todosRef(uid), {
    text,
    done: false,
    order: Date.now(),
    createdAt: serverTimestamp(),
  });
}

export function setOrder(uid, id, order) {
  return updateDoc(doc(todosRef(uid), id), { order });
}

export function setDone(uid, id, done) {
  return updateDoc(doc(todosRef(uid), id), { done });
}

export function removeTodo(uid, id) {
  return deleteDoc(doc(todosRef(uid), id));
}
