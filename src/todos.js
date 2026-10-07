import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase.js";

function todosRef(uid) {
  return collection(db, "users", uid, "todos");
}

export function watchTodos(uid, callback, onError) {
  const q = query(todosRef(uid), orderBy("createdAt", "asc"));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError,
  );
}

export function addTodo(uid, text) {
  return addDoc(todosRef(uid), {
    text,
    done: false,
    createdAt: serverTimestamp(),
  });
}

export function setDone(uid, id, done) {
  return updateDoc(doc(todosRef(uid), id), { done });
}

export function removeTodo(uid, id) {
  return deleteDoc(doc(todosRef(uid), id));
}
