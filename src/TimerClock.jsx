import { useEffect, useState } from "react";
import { formatClock, totalSeconds } from "./timer.js";

// Live time spent on a running todo. Only this component re-renders each second.
export default function TimerClock({ todo, id }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <span id={id} className="timer-clock">
      <span className="pulse" aria-hidden="true" />
      {formatClock(totalSeconds(todo, now))}
    </span>
  );
}
