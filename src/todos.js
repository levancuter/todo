import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { categoryOf } from "./category.js";
import { dayKey } from "./dates.js";
import { db } from "./firebase.js";
import { DEFAULT_ESTIMATE, estimateOf } from "./hours.js";
import { sortTodos } from "./order.js";
import { freshSubtasks, stepsOf, subtasksOf } from "./subtasks.js";
import { elapsedSeconds } from "./timer.js";

function todosRef(uid) {
  return collection(db, "users", uid, "todos");
}

function routinesRef(uid) {
  return collection(db, "users", uid, "routines");
}

function toList(snap) {
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

function mergeById(snaps) {
  const byId = new Map();
  snaps.forEach((snap) => toList(snap).forEach((t) => byId.set(t.id, t)));
  return sortTodos([...byId.values()]);
}

// Loads only open todos and todos done today, so reads don't grow with history.
// callback(todos, fromServer) runs once both queries have results. Metadata
// changes are needed to learn when the data stops coming from the cache.
export function watchTodos(uid, today, callback, onError) {
  const queries = [
    query(todosRef(uid), where("done", "==", false)),
    query(todosRef(uid), where("doneDate", "==", today)),
  ];
  const snaps = [null, null];
  let timer = null;
  const unsubs = queries.map((q, i) =>
    onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snap) => {
        snaps[i] = snap;
        if (!snaps.every(Boolean)) return;
        // Ticking a todo moves it between the queries and both fire, each in
        // its own task. Wait for both, or the todo looks deleted in between.
        clearTimeout(timer);
        timer = setTimeout(() => callback(mergeById(snaps), snaps.every((s) => !s.metadata.fromCache)));
      },
      onError,
    ),
  );
  return () => {
    clearTimeout(timer);
    unsubs.forEach((unsub) => unsub());
  };
}

// callback(routines, fromServer). Metadata changes are needed to learn when
// the data stops coming from the cache.
export function watchRoutines(uid, callback, onError) {
  return onSnapshot(
    routinesRef(uid),
    { includeMetadataChanges: true },
    (snap) => callback(toList(snap), !snap.metadata.fromCache),
    onError,
  );
}

// One-time read for the history view
export async function loadDay(uid, day) {
  const snaps = await Promise.all([
    getDocs(query(todosRef(uid), where("doneDate", "==", day))),
    getDocs(query(todosRef(uid), where("date", "==", day))),
  ]);
  return mergeById(snaps);
}

function newTodo(fields) {
  return {
    done: false,
    doneDate: null,
    order: Date.now(),
    createdAt: serverTimestamp(),
    estimate: DEFAULT_ESTIMATE,
    note: "",
    category: "work",
    routineId: null,
    date: null,
    deadline: null,
    skipped: false,
    actualSeconds: 0,
    timerStartedAt: null,
    subtasks: [],
    ...fields,
  };
}

export function addTodo(uid, text, category) {
  return addDoc(todosRef(uid), newTodo({ text, category }));
}

export function updateTodo(uid, id, fields) {
  return updateDoc(doc(todosRef(uid), id), fields);
}

export function setOrder(uid, id, order) {
  return updateTodo(uid, id, { order });
}

export function doneFields(done, today) {
  return { done, skipped: false, doneDate: done ? today : null };
}

// Skipped = closed without doing it. Stored as done so the day queries
// treat it like a done todo: shown today, not carried over, kept in history.
export function skipFields(skipped, today) {
  return { done: skipped, skipped, doneDate: skipped ? today : null };
}

export function setDone(uid, id, done, today) {
  return updateTodo(uid, id, doneFields(done, today));
}

export function setSkipped(uid, id, skipped, today) {
  return updateTodo(uid, id, skipFields(skipped, today));
}

// Adds the running time to actualSeconds. timerStoppedAt tells auto-start
// whether the current work period already had a timer.
function stopFields(todo, at) {
  return {
    actualSeconds: (todo.actualSeconds || 0) + elapsedSeconds(todo, at),
    timerStartedAt: null,
    timerStoppedAt: at,
  };
}

const startFields = (at) => ({ timerStartedAt: at, timerResume: false });

// Only one timer runs: the ones in `running` stop in the same write
export function startTimer(uid, id, running, at) {
  const batch = writeBatch(db);
  for (const todo of running) batch.update(doc(todosRef(uid), todo.id), stopFields(todo, at));
  batch.update(doc(todosRef(uid), id), startFields(at));
  return batch.commit();
}

// resume: start this todo again after the break (auto-stop at 12h / 18h)
export function stopTimer(uid, todo, at, resume = false) {
  return updateTodo(uid, todo.id, { ...stopFields(todo, at), timerResume: resume });
}

// Close the running todo (done or skipped) and start the next one in one write
export function finishRunning(uid, todo, fields, next, now) {
  const batch = writeBatch(db);
  batch.update(doc(todosRef(uid), todo.id), { ...stopFields(todo, now), ...fields });
  if (next) batch.update(doc(todosRef(uid), next.id), startFields(now));
  return batch.commit();
}

export function removeTodo(uid, id) {
  return deleteDoc(doc(todosRef(uid), id));
}

// Fixed id: two devices creating the same routine todo write one document
export function createRoutineTodo(uid, routine, today) {
  const batch = writeBatch(db);
  batch.set(
    doc(todosRef(uid), `${routine.id}_${today}`),
    newTodo({
      text: routine.text,
      subtasks: freshSubtasks(routine.subtasks),
      estimate: routine.estimate,
      category: routine.category,
      routineId: routine.id,
      date: today,
    }),
  );
  batch.update(doc(routinesRef(uid), routine.id), { lastCreated: today });
  return batch.commit();
}

// Turns a todo into today's todo of a new routine. Routine todos have no deadline.
export function startRoutine(uid, todo, days, today) {
  const routine = doc(routinesRef(uid));
  const batch = writeBatch(db);
  batch.set(routine, {
    text: todo.text,
    estimate: estimateOf(todo),
    category: categoryOf(todo),
    days,
    subtasks: stepsOf(subtasksOf(todo)),
    lastCreated: today,
    createdAt: serverTimestamp(),
  });
  batch.update(doc(todosRef(uid), todo.id), { routineId: routine.id, date: today, deadline: null });
  return batch.commit();
}

export function updateRoutine(uid, id, fields) {
  return updateDoc(doc(routinesRef(uid), id), fields);
}

// Deletes the routine; the todo stays as a normal todo
export function stopRoutine(uid, todo) {
  const batch = writeBatch(db);
  batch.delete(doc(routinesRef(uid), todo.routineId));
  batch.update(doc(todosRef(uid), todo.id), { routineId: null, date: null });
  return batch.commit();
}

// v2 todos marked done have no `doneDate`, so the day queries can't find them
export async function migrateV3(uid) {
  const meta = doc(db, "users", uid, "meta", "app");
  if ((await getDoc(meta)).data()?.migratedV3) return;
  const snap = await getDocs(query(todosRef(uid), where("done", "==", true)));
  const batch = writeBatch(db);
  snap.docs.forEach((d) => {
    const { doneDate, createdAt } = d.data();
    if (doneDate) return;
    batch.update(d.ref, { doneDate: dayKey(createdAt ? createdAt.toDate() : new Date()) });
  });
  batch.set(meta, { migratedV3: true }, { merge: true });
  await batch.commit();
}
