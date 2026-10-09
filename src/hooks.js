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
// fromServer: the data is confirmed by the server, not only from the cache.
export function useTodos(uid, today, onError) {
  const [todos, setTodos] = useState([]);
  const [fromServer, setFromServer] = useState(false);
  useEffect(
    () =>
      watchTodos(
        uid,
        today,
        (next, server) => {
          setTodos(next);
          setFromServer(server);
        },
        onError,
      ),
    [uid, today],
  );
  return [todos, setTodos, fromServer];
}

export function useRoutines(uid, onError) {
  const [state, setState] = useState({ routines: [], fromServer: false });
  useEffect(
    () => watchRoutines(uid, (routines, fromServer) => setState({ routines, fromServer }), onError),
    [uid],
  );
  return state;
}
