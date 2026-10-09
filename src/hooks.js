import { useEffect, useState } from "react";
import { watchRoutines, watchTodos } from "./todos.js";

// Current time, refreshed every minute and when the tab becomes visible again
export function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const tick = () => setNow(new Date());
    const onVisible = () => {
      if (!document.hidden) tick();
    };
    const interval = setInterval(tick, 60_000);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  return now;
}

// Open todos + todos done today. setTodos allows optimistic updates.
export function useTodos(uid, today, onError) {
  const [todos, setTodos] = useState([]);
  useEffect(() => watchTodos(uid, today, setTodos, onError), [uid, today]);
  return [todos, setTodos];
}

export function useRoutines(uid, onError) {
  const [state, setState] = useState({ routines: [], fromServer: false });
  useEffect(
    () => watchRoutines(uid, (routines, fromServer) => setState({ routines, fromServer }), onError),
    [uid],
  );
  return state;
}
