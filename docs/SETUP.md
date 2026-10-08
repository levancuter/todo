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

Thường CI/CD tự deploy (mục 7). Khi cần deploy tay:

```
npm run build
firebase deploy
```

Lệnh này deploy cả Hosting và Firestore rules. CI chỉ deploy Hosting, nên khi sửa `firestore.rules` thì chạy `firebase deploy --only firestore:rules`.

## 6. Test

```
npm test          # unit test
npm run test:ui   # test giao diện, cần Google Chrome
```

- Test giao diện chạy app thật với Firebase giả lập trong bộ nhớ (`tests/ui/mock`), không đụng dữ liệu thật.
- Không tìm thấy Chrome thì đặt biến `CHROME_PATH` trỏ tới file chạy Chrome.

## 7. CI/CD (GitHub Actions)

File `.github/workflows/ci.yml`:

- Pull request: test → build → deploy lên kênh `preview`, link được comment vào PR.
- Push hoặc merge vào `main`: test → build → deploy bản thật.
- Test fail thì không deploy.

Thiết lập một lần:

1. Chạy `firebase init hosting:github`, chọn repo `levancuter/todo`. Lệnh này tạo service account và secret `FIREBASE_SERVICE_ACCOUNT_TODO_APP_C2694` trên GitHub. Nó cũng tạo file `firebase-hosting-*.yml`: xóa đi, chỉ dùng `ci.yml`.
2. GitHub → Settings → Secrets and variables → Actions → tab **Variables**: thêm 6 biến `VITE_FIREBASE_*` giống file `.env`.
3. Sau PR đầu tiên, thêm domain preview (vd `todo-app-c2694--preview-xxxx.web.app`) vào Firebase Console → Authentication → Settings → **Authorized domains**, để đăng nhập Google được.

Lưu ý:

- Bản preview dùng chung Firestore với bản thật.
- Mọi PR dùng chung kênh `preview`, PR push sau cùng sẽ hiện trên đó.
