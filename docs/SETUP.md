# Hướng dẫn thiết lập

## 1. Cài công cụ

- Node.js LTS: https://nodejs.org (kiểm tra: `node -v`).
- Firebase CLI:

```
npm install -g firebase-tools
firebase login
```

## 2. Tạo project Firebase

Vào https://console.firebase.google.com:

1. **Add project** → đặt tên (vd: `todo-app`), tắt Google Analytics.
2. **Authentication** → Get started → Sign-in method → bật **Google**.
3. **Firestore Database** → Create database → chọn region (vd: `asia-southeast1`) → **production mode**.
4. **Project settings** → Your apps → biểu tượng Web `</>` → đăng ký app → copy `firebaseConfig`.

## 3. Cấu hình biến môi trường

Tạo file `.env` ở thư mục gốc, điền giá trị từ `firebaseConfig`:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## 4. Chạy local

```
npm install
npm run dev
```

## 5. Deploy

```
npm run build
firebase deploy
```

Lệnh này deploy cả Hosting và Firestore rules.
