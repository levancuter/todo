import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { isWorkTime } from "./category.js";
import { auth, googleProvider } from "./firebase.js";
import Icon from "./Icon.jsx";
import TodoView from "./TodoView.jsx";

const TABS = [
  ["work", "Công việc"],
  ["life", "Cuộc sống"],
];

export default function App() {
  const [user, setUser] = useState(undefined); // undefined while loading
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(() => (isWorkTime() ? "work" : "life"));

  useEffect(
    () =>
      onAuthStateChanged(auth, (next) => {
        setUser(next);
        setError(null);
      }),
    [],
  );

  const status = error ? "Lỗi: " + error.message : user === undefined ? "Đang tải..." : "";

  return (
    <main className="app" data-tab={tab}>
      <header className="topbar">
        <h1>Todo</h1>
        {user && (
          <div id="tabs" className="toggle" role="group" aria-label="Loại việc">
            {TABS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                data-tab={key}
                className={key === tab ? "active" : ""}
                aria-pressed={key === tab}
                onClick={() => setTab(key)}
              >
                <span className={"dot " + key} />
                {label}
              </button>
            ))}
          </div>
        )}
        <div id="user" hidden={!user}>
          <span id="user-name">{user?.displayName}</span>
          <button id="logout" className="link" aria-label="Đăng xuất" onClick={() => signOut(auth)}>
            <Icon name="logout" />
            <span className="label">Đăng xuất</span>
          </button>
        </div>
      </header>

      <p id="status" hidden={!status}>
        {status}
      </p>

      {user === null && (
        <section id="login-view" className="card">
          <p>Đăng nhập để xem và đồng bộ danh sách việc của bạn.</p>
          <button id="login" className="primary" onClick={() => signInWithPopup(auth, googleProvider).catch(setError)}>
            Đăng nhập bằng Google
          </button>
        </section>
      )}

      {user && <TodoView key={user.uid} uid={user.uid} tab={tab} onError={setError} />}
    </main>
  );
}
