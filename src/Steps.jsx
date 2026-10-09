import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { makeSortable } from "./drag.js";
import Icon from "./Icon.jsx";
import { newSubtaskId } from "./subtasks.js";

// Checklist of a todo, in the detail panel.
// onSave(next): save now (tick, add, delete, move). onType(next): save after typing stops.
export default function Steps({ steps, readOnly, todoDone, onSave, onType, onFocus, onBlur, onMarkDone }) {
  const [draft, setDraft] = useState("");
  const listRef = useRef(null);
  const onDrop = useRef(null);

  useEffect(() => makeSortable(listRef.current, (id, ids) => onDrop.current(id, ids)), []);

  onDrop.current = (id, ids) => {
    if (ids) flushSync(() => onSave(ids.map((x) => steps.find((s) => s.id === x))));
    // drag.js moves items with transforms; the list is now in its real order
    for (const li of listRef.current.children) {
      li.style.transform = "";
      li.classList.remove("lifted");
    }
  };

  const done = steps.filter((s) => s.done).length;
  const change = (id, fields) => steps.map((s) => (s.id === id ? { ...s, ...fields } : s));

  function add(e) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    onSave([...steps, { id: newSubtaskId(), text, done: false }]);
  }

  return (
    <section className="steps">
      <div className="steps-head">
        <span>Các bước</span>
        {steps.length > 0 && <span id="steps-count">{`${done}/${steps.length}`}</span>}
      </div>
      {steps.length > 0 && (
        <div className="bar thin">
          <span className="bar-done" style={{ width: `${(done / steps.length) * 100}%` }} />
        </div>
      )}

      <ul id="detail-steps" ref={listRef}>
        {steps.map((step) => (
          <li key={step.id} data-id={step.id} className={step.done ? "step done" : "step"}>
            {!readOnly && (
              <span className="handle" title="Kéo để sắp xếp">
                <Icon name="grip" size={14} />
              </span>
            )}
            <span className="check small">
              <input
                type="checkbox"
                checked={!!step.done}
                disabled={readOnly}
                aria-label={step.done ? "Bỏ tick bước" : "Tick bước"}
                onChange={() => onSave(change(step.id, { done: !step.done }))}
              />
              <span className="box" aria-hidden="true">
                <Icon name="check" size={10} strokeWidth={3} />
              </span>
            </span>
            <input
              className="step-text"
              aria-label="Tên bước"
              value={step.text}
              disabled={readOnly}
              onFocus={onFocus}
              onBlur={onBlur}
              onChange={(e) => onType(change(step.id, { text: e.target.value }))}
            />
            {!readOnly && (
              <button
                type="button"
                className="row-action step-delete"
                aria-label="Xóa bước"
                onClick={() => onSave(steps.filter((s) => s.id !== step.id))}
              >
                <Icon name="x" size={14} />
              </button>
            )}
          </li>
        ))}
      </ul>

      {!readOnly && (
        <label className="step-add">
          <Icon name="plus" size={16} />
          <input
            id="detail-step-new"
            aria-label="Thêm bước"
            placeholder="Thêm bước rồi nhấn Enter"
            autoComplete="off"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={add}
          />
        </label>
      )}

      {/* All steps ticked: suggest, never mark the todo done by itself */}
      {!readOnly && !todoDone && steps.length > 0 && done === steps.length && (
        <p id="steps-hint">
          Đã xong hết bước.
          <button type="button" className="link" onClick={onMarkDone}>
            Đánh dấu xong
          </button>
        </p>
      )}
    </section>
  );
}
