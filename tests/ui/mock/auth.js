// Stand-in for firebase/auth: always signed in as a test user
export function onAuthStateChanged(_auth, cb) {
  setTimeout(() => cb({ uid: "u1", displayName: "Tester" }));
}
export const signInWithPopup = async () => {};
export const signOut = async () => {};
