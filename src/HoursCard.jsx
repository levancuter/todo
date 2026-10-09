import { WORK_HOURS_PER_DAY } from "./category.js";
import { formatHours, sumHours } from "./hours.js";
import Icon from "./Icon.jsx";

const percent = (part, whole) => `${whole > 0 ? Math.min(part / whole, 1) * 100 : 0}%`;

// history: a past day (done vs unfinished); otherwise today's plan.
// Work plans are measured against an 8-hour day.
export default function HoursCard({ todos, tab, workLeft, history }) {
  const h = sumHours(todos);
  const isWork = tab === "work" && !history;
  const scale = isWork ? Math.max(WORK_HOURS_PER_DAY, h.total) : h.total;
  const over = isWork && h.total > WORK_HOURS_PER_DAY;
  const late = isWork && h.left > workLeft;

  let total = formatHours(h.total);
  let cap = "tổng";
  let detail = `Xong ${formatHours(h.done)} · Còn ${formatHours(h.left)} việc`;
  if (h.actual > 0) detail += ` · Thực tế ${formatHours(h.actual)}`;
  if (isWork) cap = over ? `/ 8h · vượt ${formatHours(h.total - WORK_HOURS_PER_DAY)}` : "/ 8h kế hoạch";
  if (history) {
    total = formatHours(h.done);
    cap = "đã xong";
    detail = `Chưa xong ${formatHours(h.left)}`;
  }

  return (
    <section id="hours" className="card hours">
      <div className="hours-head">
        <p className="hours-total">
          <strong id="hours-total" className={over ? "over" : ""}>
            {total}
          </strong>
          <span id="hours-cap">{cap}</span>
        </p>
        {isWork && (
          <span id="work-left" className={late ? "warn" : ""}>
            <Icon name="clock" size={14} />
            {`Còn ${formatHours(Math.floor(workLeft * 10) / 10)} giờ làm${late ? " · không kịp" : ""}`}
          </span>
        )}
      </div>
      <div className="bar">
        <span className={over ? "bar-plan over" : "bar-plan"} style={{ width: percent(h.total, scale) }} />
        <span className="bar-done" style={{ width: percent(h.done, scale) }} />
      </div>
      <p id="hours-detail">{detail}</p>
    </section>
  );
}
