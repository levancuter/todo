import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { categoryOf, isWorkTime, workHoursLeft } from "./category.js";
import { historyTodos, todayTodos } from "./daily.js";
import { addDays, dayKey, formatDay } from "./dates.js";
import DetailPanel from "./DetailPanel.jsx";
import { makeSortable } from "./drag.js";
import { useNow, useRoutines, useTodos } from "./hooks.js";
import { formatHours, sumHours } from "./hours.js";
import { orderBetween, sortTodos } from "./order.js";
import { dueRoutines } from "./routines.js";
import { HistoryItem, TodoItem } from "./TodoItem.jsx";
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
} from "./todos.js";

const ROUTINE_FIELDS = ["text", "estimate", "category"];
const TABS = [
  ["work", "Công việc"],
  ["life", "Cuộc sống"],
  ["all", "Tất cả"],
];

export default function TodoView({ uid, onError }) {
  const now = useNow();
  const today = dayKey(now);
  const [todos, setTodos] = useTodos(uid, today, onError); // open todos + todos done today
  const { routines, fromServer } = useRoutines(uid, onError);
  const [tab, setTab] = useState(() => (isWorkTime() ? "work" : "life"));
  const [viewDay, setViewDay] = useState(null); // past day shown read-only, null = today
  const [history, setHistory] = useState(null); // { day, todos } loaded for the history view
  const [selectedId, setSelectedId] = useState(null);
  const [newText, setNewText] = useState("");
  const listRef = useRef(null);
  const panelRef = useRef(null);
  const onDrop = useRef(null);
  const requested = useRef(new Set()); // routine todos already created this session

  useEffect(() => {
    // Not critical: if it fails (e.g. offline) it runs again next time
    migrateV3(uid).catch((err) => console.warn("migrateV3", err));
  }, [uid]);

  // Only trust routines read from the server: a stale cache could recreate
  // a todo that another device already created and the user changed
  useEffect(() => {
    if (!fromServer) return;
    for (const routine of dueRoutines(routines, today)) {
      const key = `${routine.id}_${today}`;
      if (requested.current.has(key)) continue;
      requested.current.add(key);
      createRoutineTodo(uid, routine, today).catch(onError);
    }
  }, [uid, routines, fromServer, today]);

  useEffect(() => makeSortable(listRef.current, (id, ids) => onDrop.current(id, ids)), []);

  onDrop.current = (id, ids) => {
    if (ids) {
      const index = ids.indexOf(id);
      const find = (x) => todos.find((t) => t.id === x);
      const order = orderBetween(find(ids[index - 1]), find(ids[index + 1]));
      // Reorder on screen now instead of waiting for Firestore
      flushSync(() => setTodos(sortTodos(todos.map((t) => (t.id === id ? { ...t, order } : t)))));
      setOrder(uid, id, order).catch(onError);
    }
    // drag.js moves items with transforms; the list is now in its real order
    for (const li of listRef.current.children) {
      li.style.transform = "";
      li.classList.remove("lifted");
    }
  };

  const visible = todayTodos(todos, today);
  const selected = viewDay ? null : (visible.find((t) => t.id === selectedId) ?? null);

  // The open todo was deleted: drop its unsaved edits
  useEffect(() => {
    if (selectedId && !viewDay && !selected) {
      panelRef.current.discard();
      setSelectedId(null);
    }
  }, [selectedId, selected, viewDay]);

  function close() {
    panelRef.current.flush();
    setSelectedId(null);
  }

  function select(id) {
    if (id === selectedId) close();
    else setSelectedId(id);
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && selectedId) close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selectedId]);

  function openDay(day) {
    close();
    if (day >= today) {
      setViewDay(null);
      return;
    }
    setViewDay(day);
    loadDay(uid, day).then((result) => setHistory({ day, todos: result }), onError);
  }

  function add(e) {
    e.preventDefault();
    const text = newText.trim();
    if (!text) return;
    setNewText("");
    const category = tab === "all" ? (isWorkTime() ? "work" : "life") : tab;
    addTodo(uid, text, category).catch(onError);
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
      if (Object.keys(shared).length) updateRoutine(uid, routine.id, shared).catch(onError);
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
    if (saving) saving.catch(onError);
  }

  const byTab = (items) => (tab === "all" ? items : items.filter((t) => categoryOf(t) === tab));
  const showDot = tab === "all";
  const historyLoaded = history && history.day === viewDay ? history.todos : null;

  let shown = [];
  let content;
  let hours;
  let count = "";
  let emptyText = "Chưa có việc nào.";

  if (!viewDay) {
    shown = byTab(visible);
    content = shown.map((todo) => (
      <TodoItem
        key={todo.id}
        todo={todo}
        today={today}
        showDot={showDot}
        selected={todo.id === selectedId}
        onToggle={(id, done) => setDone(uid, id, done, today).catch(onError)}
        onSelect={select}
        onDelete={(id) => removeTodo(uid, id).catch(onError)}
      />
    ));
    const left = shown.filter((t) => !t.done).length;
    if (shown.length) count = `Còn ${left} / ${shown.length} việc`;
    const h = sumHours(shown);
    const workLeft = workHoursLeft(now);
    const late = h.left > workLeft;
    hours = (
      <>
        {`Tổng ${formatHours(h.total)} · Còn ${formatHours(h.left)} · Xong ${formatHours(h.done)}`}
        {tab === "work" && (
          <>
            {" · "}
            <span className={late ? "warn" : ""}>
              {`${late ? "⚠ " : ""}Giờ làm còn ${formatHours(Math.floor(workLeft * 2) / 2)}`}
            </span>
          </>
        )}
      </>
    );
  } else if (historyLoaded) {
    shown = byTab(historyTodos(historyLoaded, viewDay));
    content = shown.map((todo) => <HistoryItem key={todo.id} todo={todo} showDot={showDot} />);
    emptyText = "Không có việc nào.";
    const h = sumHours(shown);
    hours = `Xong ${formatHours(h.done)} · Chưa xong ${formatHours(h.left)}`;
    const done = shown.filter((t) => t.done).length;
    if (shown.length) count = `Xong ${done} / ${shown.length} việc`;
  } else {
    emptyText = "Đang tải...";
  }

  return (
    <section id="todo-view">
      <nav id="tabs">
        {TABS.map(([key, label]) => (
          <button key={key} data-tab={key} className={key === tab ? "active" : ""} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </nav>
      <div id="day-nav">
        <button id="prev-day" className="icon" title="Ngày trước" onClick={() => openDay(addDays(viewDay || today, -1))}>
          ←
        </button>
        <span id="day-label">{viewDay ? formatDay(viewDay) : `Hôm nay · ${formatDay(today)}`}</span>
        <button id="next-day" className="icon" title="Ngày sau" disabled={!viewDay} onClick={() => openDay(addDays(viewDay, 1))}>
          →
        </button>
      </div>
      <form id="add-form" hidden={!!viewDay} onSubmit={add}>
        <input
          id="new-todo"
          type="text"
          placeholder="Thêm việc mới..."
          autoComplete="off"
          autoFocus
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
        />
      </form>
      <p id="hours">{hours}</p>
      <ul id="todo-list" ref={listRef}>
        {content}
      </ul>
      <p id="empty" hidden={shown.length > 0}>
        {emptyText}
      </p>
      <p id="count">{count}</p>

      <DetailPanel
        ref={panelRef}
        todo={selected}
        routine={selected ? routineOf(selected) : undefined}
        onSave={saveTodo}
        onDone={(id, done) => setDone(uid, id, done, today).catch(onError)}
        onRepeat={setRepeat}
        onDelete={(id) => removeTodo(uid, id).catch(onError)}
        onClose={close}
        onError={onError}
      />
    </section>
  );
}
