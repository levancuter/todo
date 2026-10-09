import { useEffect, useImperativeHandle, useRef, useState } from "react";
import { categoryOf } from "./category.js";
import { actualOf, estimateOf, parseHours, round1 } from "./hours.js";
import Icon from "./Icon.jsx";
import { REPEAT_DAILY, REPEAT_WEEKDAYS, repeatMode } from "./routines.js";

const SAVE_DELAY_MS = 500;
const DAYS = [
  [1, "T2"],
  [2, "T3"],
  [3, "T4"],
  [4, "T5"],
  [5, "T6"],
  [6, "T7"],
  [0, "CN"],
];

// Values of the editable fields for a todo
function valuesOf(todo) {
  return {
    text: todo.text,
    estimate: String(estimateOf(todo)),
    actual: String(round1(actualOf(todo))),
    note: todo.note || "",
    category: categoryOf(todo),
    deadline: todo.deadline || "",
  };
}

// ref exposes flush() (save now) and discard() (drop unsaved edits).
// Handlers: onSave(id, fields) -> Promise, onDone(id, done), onSkip(id, skipped), onRepeat(id, days | null),
// onDelete(id), onClose(), onError(err)
export default function DetailPanel({ ref, todo, routine, ...handlers }) {
  const latest = useRef(handlers);
  latest.current = handlers;
  const shown = useRef(null); // the open todo with local edits applied
  const pending = useRef({}); // edited fields not yet sent
  const timer = useRef(null);
  const saving = useRef(0);
  const focused = useRef(null); // field being typed in
  const [values, setValues] = useState(null);
  const [status, setStatus] = useState("");
  const [customPicked, setCustomPicked] = useState(false); // keep day buttons open
  const id = todo?.id;

  function flush() {
    clearTimeout(timer.current);
    const fields = pending.current;
    if (!shown.current || Object.keys(fields).length === 0) return;
    pending.current = {};
    shown.current = { ...shown.current, ...fields };
    saving.current++;
    latest.current
      .onSave(shown.current.id, fields)
      .then(() => {
        saving.current--;
        if (saving.current === 0 && Object.keys(pending.current).length === 0) setStatus("Đã lưu");
      })
      .catch((err) => {
        saving.current--;
        setStatus("");
        latest.current.onError(err);
      });
  }

  useImperativeHandle(ref, () => ({
    flush,
    discard() {
      clearTimeout(timer.current);
      pending.current = {};
    },
  }));

  // Another todo opened: save the previous one's edits. When the panel
  // closes, the parent has already flushed or discarded them.
  useEffect(() => {
    if (id && shown.current && shown.current.id !== id) flush();
    focused.current = null;
    setStatus("");
    setCustomPicked(false);
  }, [id]);

  useEffect(() => {
    if (!todo) {
      shown.current = null;
      return;
    }
    shown.current = { ...todo, ...pending.current };
    const next = valuesOf(shown.current);
    // Don't overwrite what the user is typing
    setValues((prev) => (prev && focused.current ? { ...next, [focused.current]: prev[focused.current] } : next));
  }, [todo]);

  useEffect(() => {
    document.body.classList.toggle("detail-open", !!todo);
  }, [!!todo]);
  useEffect(() => () => document.body.classList.remove("detail-open"), []);

  // saveAs: the todo field to save when it differs from the input's name
  function edit(field, value, parsed, saveAs = field) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (parsed === null) return;
    pending.current[saveAs] = parsed;
    setStatus("Đang lưu...");
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, SAVE_DELAY_MS);
  }

  // Save at once (select, date): no typing to wait for
  function saveNow(field, value, parsed) {
    setValues((prev) => ({ ...prev, [field]: value }));
    pending.current[field] = parsed;
    flush();
  }

  // Save right away and put back the stored value if the input was invalid
  function blur(field) {
    focused.current = null;
    flush();
    if (shown.current) setValues((prev) => ({ ...prev, [field]: valuesOf(shown.current)[field] }));
  }

  const typing = (field) => ({
    value: values?.[field] ?? "",
    onFocus: () => (focused.current = field),
    onBlur: () => blur(field),
  });

  const days = routine ? routine.days : [];
  const mode = customPicked ? "custom" : repeatMode(days);

  function onRepeatChange(e) {
    const next = e.target.value;
    setCustomPicked(next === "custom");
    if (next === "none") latest.current.onRepeat(id, null);
    if (next === "daily") latest.current.onRepeat(id, REPEAT_DAILY);
    if (next === "weekdays") latest.current.onRepeat(id, REPEAT_WEEKDAYS);
    if (next === "custom" && !routine) latest.current.onRepeat(id, [new Date().getDay()]);
  }

  function toggleDay(day) {
    const next = days.includes(day) ? days.filter((d) => d !== day) : [...days, day];
    if (next.length === 0) setCustomPicked(false);
    latest.current.onRepeat(id, next.length ? next.sort((a, b) => a - b) : null);
  }

  return (
    <aside id="detail" aria-label="Chi tiết việc" hidden={!todo}>
      <div className="detail-head">
        <span className="eyebrow">Chi tiết việc</span>
        <button id="detail-close" className="icon-button" aria-label="Đóng" onClick={() => latest.current.onClose()}>
          <Icon name="x" size={18} />
        </button>
      </div>

      <div className="detail-title">
        <span className="check">
          <input
            id="detail-done"
            type="checkbox"
            aria-label="Hoàn thành"
            checked={!!todo?.done && !todo.skipped}
            onChange={(e) => latest.current.onDone(id, e.target.checked)}
          />
          <span className="box" aria-hidden="true">
            <Icon name="check" size={12} strokeWidth={3} />
          </span>
        </span>
        <input
          id="detail-text"
          type="text"
          aria-label="Tên việc"
          autoComplete="off"
          {...typing("text")}
          onChange={(e) => edit("text", e.target.value, e.target.value.trim() || null)}
        />
      </div>

      <div className="detail-actions">
        <button id="detail-skip" type="button" className="chip-button" onClick={() => latest.current.onSkip(id, !todo?.skipped)}>
          <Icon name="skip" size={14} />
          {todo?.skipped ? "Hủy bỏ qua" : "Bỏ qua"}
        </button>
      </div>

      <div className="detail-grid">
        <label className="field">
          Giờ dự kiến
          <span className="input-unit">
            <input
              id="detail-estimate"
              type="number"
              min="0"
              step="0.1"
              inputMode="decimal"
              {...typing("estimate")}
              onChange={(e) => edit("estimate", e.target.value, parseHours(e.target.value))}
            />
            h
          </span>
        </label>
        <label className="field">
          Giờ thực tế
          <span className="input-unit">
            <input
              id="detail-actual"
              type="number"
              min="0"
              step="0.1"
              inputMode="decimal"
              {...typing("actual")}
              onChange={(e) => {
                const hours = parseHours(e.target.value);
                edit("actual", e.target.value, hours === null ? null : Math.round(hours * 3600), "actualSeconds");
              }}
            />
            h
          </span>
        </label>
        <label className="field">
          Loại
          <select
            id="detail-category"
            value={values?.category ?? "work"}
            onChange={(e) => saveNow("category", e.target.value, e.target.value)}
          >
            <option value="work">Công việc</option>
            <option value="life">Cuộc sống</option>
          </select>
        </label>
        <label className="field">
          Lặp lại
          <select id="detail-repeat" value={mode} onChange={onRepeatChange}>
            <option value="none">Không lặp lại</option>
            <option value="daily">Hằng ngày</option>
            <option value="weekdays">Thứ 2 – Thứ 6</option>
            <option value="custom">Chọn thứ</option>
          </select>
        </label>
        {/* Only one-off todos have a deadline */}
        <label id="detail-deadline-row" className="field" hidden={mode !== "none"}>
          Hạn chót
          <input
            id="detail-deadline"
            type="date"
            value={values?.deadline ?? ""}
            onChange={(e) => saveNow("deadline", e.target.value, e.target.value || null)}
          />
        </label>
      </div>

      <div id="detail-days" hidden={mode !== "custom"}>
        {DAYS.map(([day, label]) => (
          <button key={day} type="button" data-day={day} aria-pressed={days.includes(day)} onClick={() => toggleDay(day)}>
            {label}
          </button>
        ))}
      </div>

      <label className="field">
        Ghi chú
        <textarea
          id="detail-note"
          rows={6}
          placeholder="Thêm ghi chú…"
          {...typing("note")}
          onChange={(e) => edit("note", e.target.value, e.target.value)}
        />
      </label>

      <div className="detail-foot">
        <p className="detail-meta">
          {/* createdAt is null until the server confirms a new todo */}
          <span id="detail-created">
            {todo?.createdAt ? "Tạo ngày " + todo.createdAt.toDate().toLocaleDateString("vi-VN") : ""}
          </span>
          <span id="detail-status">{status}</span>
        </p>
        <button id="detail-delete" className="danger" onClick={() => latest.current.onDelete(id)}>
          <Icon name="trash" size={14} />
          Xóa việc
        </button>
      </div>
    </aside>
  );
}
