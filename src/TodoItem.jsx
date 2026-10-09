import { carriedFrom, deadlineStatus } from "./daily.js";
import { formatDay } from "./dates.js";
import { estimateOf, formatHours, round1 } from "./hours.js";
import Icon from "./Icon.jsx";
import { repeatLabel } from "./routines.js";
import { totalSeconds } from "./timer.js";
import TimerClock from "./TimerClock.jsx";

// Labels under the title: repeat, skipped, deadline, carried over, unfinished
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
  if (todo.skipped) {
    tags.push(<span key="skipped" className="tag">Bỏ qua</span>);
    return tags;
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

// A skipped todo shows a dashed circle; ticking it marks it done instead
function Check({ todo, onToggle }) {
  const done = todo.done && !todo.skipped;
  return (
    <span className={todo.skipped ? "check skipped" : "check"}>
      <input
        type="checkbox"
        checked={done}
        disabled={!onToggle}
        readOnly={!onToggle}
        onChange={onToggle && ((e) => onToggle(todo.id, e.target.checked))}
        aria-label={done ? "Bỏ đánh dấu xong" : "Đánh dấu xong"}
      />
      <span className="box" aria-hidden="true">
        <Icon name={todo.skipped ? "skip" : "check"} size={todo.skipped ? 10 : 12} strokeWidth={3} />
      </span>
    </span>
  );
}

// The running clock sits in the label line, so it never squeezes the title
function Body({ todo, tags, clock, onClick }) {
  const Tag = onClick ? "button" : "span";
  return (
    <Tag type={onClick ? "button" : undefined} className="text" onClick={onClick}>
      <span className="title">{todo.text}</span>
      {(clock || tags.length > 0) && (
        <span className="meta">
          {clock}
          {tags}
        </span>
      )}
    </Tag>
  );
}

// Keeps a button's column when the row has no such button, so columns line up
const Slot = ({ name }) => <span className={`slot slot-${name}`} aria-hidden="true" />;

// "1.5/2h" once time was spent (running timer included), red when over the estimate
function Estimate({ todo }) {
  const estimate = estimateOf(todo);
  const actual = totalSeconds(todo, Date.now()) / 3600;
  if (actual < 0.05) return <span className="estimate">{formatHours(estimate)}</span>;
  return (
    <span className={actual > estimate ? "estimate over" : "estimate"}>
      {round1(actual)}/{formatHours(estimate)}
    </span>
  );
}

// pauseLocked: a work todo during work time keeps its timer running
export function TodoItem({ todo, today, routine, selected, pauseLocked, onToggle, onSkip, onStart, onPause, onSelect, onDelete }) {
  const running = !!todo.timerStartedAt;
  const className = [
    "todo",
    todo.done && (todo.skipped ? "skipped" : "done"),
    running && "running",
    selected && "selected",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <li className={className} data-id={todo.id}>
      <span className="handle" title="Kéo để sắp xếp">
        <Icon name="grip" />
      </span>
      <Check todo={todo} onToggle={onToggle} />
      <Body
        todo={todo}
        tags={tagsOf(todo, { today, routine })}
        clock={running && <TimerClock todo={todo} />}
        onClick={() => onSelect(todo.id)}
      />
      <Estimate todo={todo} />
      {running && !pauseLocked ? (
        <button type="button" className="timer-button running" title="Tạm dừng" aria-label="Tạm dừng bấm giờ" onClick={() => onPause(todo)}>
          <Icon name="pause" size={12} />
        </button>
      ) : !running && !todo.done ? (
        <button type="button" className="timer-button" title="Bắt đầu bấm giờ" aria-label="Bắt đầu bấm giờ" onClick={() => onStart(todo.id)}>
          <Icon name="play" size={12} />
        </button>
      ) : (
        <Slot name="timer" />
      )}
      {todo.done ? (
        <Slot name="skip" />
      ) : (
        <button type="button" className="row-action skip" title="Bỏ qua" aria-label="Bỏ qua" onClick={() => onSkip(todo.id)}>
          <Icon name="skip" size={14} />
        </button>
      )}
      <button type="button" className="row-action delete" title="Xóa" aria-label="Xóa việc" onClick={() => onDelete(todo.id)}>
        <Icon name="x" />
      </button>
    </li>
  );
}

export function HistoryItem({ todo, routine, selected, onSelect }) {
  const state = todo.skipped ? "skipped" : todo.done ? "done" : "";
  return (
    <li className={`todo readonly ${state} ${selected ? "selected" : ""}`} data-id={todo.id}>
      <Check todo={todo} />
      <Body todo={todo} tags={tagsOf(todo, { routine, history: true })} onClick={() => onSelect(todo.id)} />
      <Estimate todo={todo} />
    </li>
  );
}
