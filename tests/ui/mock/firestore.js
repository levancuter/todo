// In-memory stand-in for the parts of firebase/firestore used by src/todos.js.
// Data comes from window.__seed: { "todos/a": {...}, "routines/r1": {...} },
// with createdAt in ms.
const U = "users/u1/";
const ts = (ms) => ({ toMillis: () => ms, toDate: () => new Date(ms) });

const store = new Map(
  Object.entries(window.__seed || {}).map(([path, data]) => [
    U + path,
    data.createdAt ? { ...data, createdAt: ts(data.createdAt) } : data,
  ]),
);

let online = false; // false: snapshots report fromCache, like right after opening the app
let nextId = 1;
const listeners = new Set();
const writes = [];

// Test hooks
window.__writes = writes;
window.__get = (path) => store.get(U + path);
// Change data as if from another device
window.__remote = (fn) => {
  fn(store, U);
  emit();
};
window.__goOnline = () => {
  online = true;
  emit();
};

const parentOf = (path) => path.slice(0, path.lastIndexOf("/"));
const idOf = (path) => path.slice(path.lastIndexOf("/") + 1);
const ref = (path) => ({ path, id: idOf(path) });

function snapshot(q) {
  const docs = [...store]
    .filter(([path, data]) => parentOf(path) === q.path && q.filters.every((f) => data[f.field] === f.value))
    .map(([path, data]) => ({ id: idOf(path), ref: ref(path), data: () => ({ ...data }) }));
  return { docs, metadata: { fromCache: !online } };
}

// Like the real SDK: each listener gets its snapshot in its own task
function emit() {
  listeners.forEach((l) => {
    const snap = snapshot(l.q);
    setTimeout(() => listeners.has(l) && l.cb(snap));
  });
}

function apply([type, r, data, opts]) {
  if (type === "set") store.set(r.path, opts?.merge ? { ...store.get(r.path), ...data } : { ...data });
  if (type === "update") {
    if (!store.has(r.path)) throw new Error("No document to update: " + r.path);
    store.set(r.path, { ...store.get(r.path), ...data });
  }
  if (type === "delete") store.delete(r.path);
  writes.push([type, r.path.replace(U, ""), data]);
}

export const collection = (_db, ...segments) => ({ path: segments.join("/"), filters: [] });
export function doc(parent, ...segments) {
  if (parent.path !== undefined) return ref(parent.path + "/" + (segments[0] ?? "auto" + nextId++));
  return ref(segments.join("/"));
}
export const query = (coll, ...filters) => ({ path: coll.path, filters });
export const where = (field, _op, value) => ({ field, value });
export const serverTimestamp = () => ts(Date.now());

export function onSnapshot(q, ...args) {
  const cb = typeof args[0] === "function" ? args[0] : args[1];
  const l = { q, cb };
  listeners.add(l);
  setTimeout(() => listeners.has(l) && cb(snapshot(q)));
  return () => listeners.delete(l);
}

export async function getDocs(q) {
  return snapshot(q);
}

export async function getDoc(r) {
  const data = store.get(r.path);
  return { exists: () => !!data, data: () => (data ? { ...data } : undefined) };
}

export async function addDoc(coll, data) {
  apply(["set", doc(coll), data]);
  emit();
}

export async function updateDoc(r, fields) {
  apply(["update", r, fields]);
  emit();
}

export async function deleteDoc(r) {
  apply(["delete", r]);
  emit();
}

export function writeBatch() {
  const ops = [];
  return {
    set: (r, data, opts) => ops.push(["set", r, data, opts]),
    update: (r, data) => ops.push(["update", r, data]),
    delete: (r) => ops.push(["delete", r]),
    commit: async () => {
      ops.forEach(apply);
      emit();
    },
  };
}
