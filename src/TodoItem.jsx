import { categoryOf } from "./category.js";
import { carriedFrom, deadlineStatus } from "./daily.js";
import { formatDay } from "./dates.js";
import { estimateOf, formatHours } from "./hours.js";

function DeadlineTag({ todo, today }) {
  const status = deadlineStatus(todo, today);
  if (status === "overdue") return <span className="tag missed">quá hạn {formatDay(todo.deadline)}</span>;
  if (status === "today") return <span className="tag due">hạn hôm nay</span>;
  if (status === "upcoming") return <span className="tag">hạn {formatDay(todo.deadline)}</span>;
  return null;
}

// Text and labels shared by today's list and the history list
function TodoText({ todo, showDot, onClick, children }) {
  return (
    <span className="text" onClick={onClick}>
      {showDot && <span className={"dot " + categoryOf(todo)} />}
      {(todo.routineId ? "🔁 " : "") + todo.text}
      {children}
    </span>
  );
}

function Estimate({ todo }) {
  return <span className="estimate">{formatHours(estimateOf(todo))}</span>;
}

export function TodoItem({ todo, today, showDot, selected, onToggle, onSelect, onDelete }) {
  const from = carriedFrom(todo, today);
  const className = [todo.done && "done", selected && "selected"].filter(Boolean).join(" ");
  return (
    <li className={className} data-id={todo.id}>
      <span className="handle" title="Kéo để sắp xếp">
        ⋮⋮
      </span>
      <input type="checkbox" checked={!!todo.done} onChange={(e) => onToggle(todo.id, e.target.checked)} />
      <TodoText todo={todo} showDot={showDot} onClick={() => onSelect(todo.id)}>
        {from && <span className="tag">từ {formatDay(from)}</span>}
        <DeadlineTag todo={todo} today={today} />
      </TodoText>
      <Estimate todo={todo} />
      <button className="delete" title="Xóa" onClick={() => onDelete(todo.id)}>
        ✕
      </button>
    </li>
  );
}

export function HistoryItem({ todo, showDot }) {
  return (
    <li className={todo.done ? "done readonly" : "readonly"}>
      <input type="checkbox" checked={!!todo.done} disabled readOnly />
      <TodoText todo={todo} showDot={showDot}>
        {!todo.done && <span className="tag missed">chưa xong</span>}
      </TodoText>
      <Estimate todo={todo} />
    </li>
  );
}
