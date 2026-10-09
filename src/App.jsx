import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth, googleProvider } from "./firebase.js";
import TodoView from "./TodoView.jsx";

export default function App() {
  const [user, setUser] = useState(undefined); // undefined while loading
  const [error, setError] = useState(null);

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
    <main>
      <header>
        <h1>Todo</h1>
        <div id="user" hidden={!user}>
          <span id="user-name">{user?.displayName}</span>
          <button id="logout" className="link" onClick={() => signOut(auth)}>
            Đăng xuất
          </button>
        </div>
      </header>

      <p id="status" hidden={!status}>
        {status}
      </p>

      {user === null && (
        <section id="login-view">
          <p>Đăng nhập để xem và đồng bộ danh sách việc của bạn.</p>
          <button id="login" className="primary" onClick={() => signInWithPopup(auth, googleProvider).catch(setError)}>
            Đăng nhập bằng Google
          </button>
        </section>
      )}

      {user && <TodoView key={user.uid} uid={user.uid} onError={setError} />}
    </main>
  );
}
