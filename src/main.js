import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "./firebase.js";

const status = document.getElementById("status");
const loginBtn = document.getElementById("login");
const logoutBtn = document.getElementById("logout");

loginBtn.addEventListener("click", () => {
  signInWithPopup(auth, googleProvider).catch((err) => {
    status.textContent = "Lỗi đăng nhập: " + err.message;
  });
});

logoutBtn.addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, (user) => {
  if (user) {
    status.textContent = "Xin chào, " + user.displayName;
  } else {
    status.textContent = "Chưa đăng nhập";
  }
  loginBtn.hidden = !!user;
  logoutBtn.hidden = !user;
});
