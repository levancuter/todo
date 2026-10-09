import { carriedFrom, deadlineStatus } from "./daily.js";
import { formatDay } from "./dates.js";
import { estimateOf, formatHours } from "./hours.js";
import Icon from "./Icon.jsx";
import { repeatLabel } from "./routines.js";

// Labels under the title: repeat, deadline, carried over, unfinished
function tagsOf(todo, { today, routine, history }) {
  const tags = [];
  if (todo.routineId) {
    tags.push(
      <span key="repeat" className="tag repeat">
        <Icon name="repeat" size={12} />
        {repeatLabel(routine?.days) ?? "Lặp lại"}
      </span>,
    );
  }
  if (history) {
    if (!todo.done) tags.push(<span key="missed" className="tag missed">Chưa xong</span>);
    return tags;
  }
  const status = deadlineStatus(todo, today);
  if (status === "overdue") tags.push(<span key="deadline" className="tag missed">Quá hạn {formatDay(todo.deadline)}</span>);
  if (status === "today") tags.push(<span key="deadline" className="tag due">Hạn hôm nay</span>);
  if (status === "upcoming") tags.push(<span key="deadline" className="tag">Hạn {formatDay(todo.deadline)}</span>);
  const from = carriedFrom(todo, today);
  if (from) tags.push(<span key="from" className="tag">Từ {formatDay(from)}</span>);
  return tags;
}

function Check({ todo, onToggle }) {
  return (
    <span className="check">
      <input
        type="checkbox"
        checked={!!todo.done}
        disabled={!onToggle}
        readOnly={!onToggle}
        onChange={onToggle && ((e) => onToggle(todo.id, e.target.checked))}
        aria-label={todo.done ? "Bỏ đánh dấu xong" : "Đánh dấu xong"}
      />
      <span className="box" aria-hidden="true">
        <Icon name="check" size={12} strokeWidth={3} />
      </span>
    </span>
  );
}

function Body({ todo, tags, onClick }) {
  const Tag = onClick ? "button" : "span";
  return (
    <Tag type={onClick ? "button" : undefined} className="text" onClick={onClick}>
      <span className="title">{todo.text}</span>
      {tags.length > 0 && <span className="meta">{tags}</span>}
    </Tag>
  );
}

function Estimate({ todo }) {
  return <span className="estimate">{formatHours(estimateOf(todo))}</span>;
}

export function TodoItem({ todo, today, routine, selected, onToggle, onSelect, onDelete }) {
  const className = ["todo", todo.done && "done", selected && "selected"].filter(Boolean).join(" ");
  return (
    <li className={className} data-id={todo.id}>
      <span className="handle" title="Kéo để sắp xếp">
        <Icon name="grip" />
      </span>
      <Check todo={todo} onToggle={onToggle} />
      <Body todo={todo} tags={tagsOf(todo, { today, routine })} onClick={() => onSelect(todo.id)} />
      <Estimate todo={todo} />
      <button type="button" className="delete" title="Xóa" aria-label="Xóa việc" onClick={() => onDelete(todo.id)}>
        <Icon name="x" />
      </button>
    </li>
  );
}

export function HistoryItem({ todo, routine }) {
  return (
    <li className={todo.done ? "todo done readonly" : "todo readonly"}>
      <Check todo={todo} />
      <Body todo={todo} tags={tagsOf(todo, { routine, history: true })} />
      <Estimate todo={todo} />
    </li>
  );
}
