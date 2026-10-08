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
- Merge vào `main`: test → build → deploy bản thật.
- Test fail thì không deploy.

### 7.1. Secret deploy Firebase

Chạy trong terminal (cần `firebase login` trước):

```
firebase init hosting:github
```

Trả lời các câu hỏi:

| Câu hỏi | Trả lời |
|---|---|
| GitHub repository | `levancuter/todo` |
| Set up the workflow to run a build script before every deploy? | Tùy, file này sẽ bị xóa |
| Set up automatic deployment ... when a PR is merged? | `No` |

- Lệnh mở trình duyệt để đăng nhập GitHub, rồi tạo service account và secret `FIREBASE_SERVICE_ACCOUNT_TODO_APP_C2694` trên repo.
- Lệnh tạo thêm file `.github/workflows/firebase-hosting-*.yml`: xóa đi, không commit. Chỉ dùng `ci.yml`.

### 7.2. Biến build

GitHub → repo → Settings → Secrets and variables → Actions → tab **Variables** → New repository variable. Thêm 6 biến, giá trị giống file `.env`:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

Có thể làm trong VS Code bằng extension **GitHub Actions** (của GitHub): mục *Settings* → *Variables*.

### 7.3. Đăng nhập trên bản preview

Sau PR đầu tiên, lấy domain preview trong comment của PR (vd `todo-app-c2694--preview-xxxx.web.app`), thêm vào Firebase Console → Authentication → Settings → **Authorized domains**. Chỉ làm một lần vì mọi PR dùng chung kênh `preview`.

### 7.4. Chặn push thẳng vào `main`

Cần repo public (repo private phải có GitHub Pro).

1. Settings → General → Danger Zone → Change visibility → **Public**.
2. Settings → Rules → Rulesets → **New branch ruleset**:
   - Target: Include default branch.
   - Bật **Require a pull request before merging**, số approval để `0`.
   - Bật **Require status checks to pass**, thêm check `test`. Check này chỉ hiện sau khi workflow chạy ít nhất một lần.
   - Bật **Block force pushes** và **Restrict deletions**.
   - Để trống **Bypass list**, để luật áp dụng cả với chủ repo.

### 7.5. Ẩn email trong commit

Repo public thì ai cũng thấy email của commit.

1. GitHub → Settings → Emails: bật **Keep my email addresses private** và **Block command line pushes that expose my email**.
2. Đổi email git sang địa chỉ noreply hiện trên trang đó:

```
git config --global user.email "221241714+levancuter@users.noreply.github.com"
```

Commit cũ vẫn giữ email cũ.

### 7.6. Làm việc hằng ngày

```
git checkout -b feature/ten-chuc-nang
# sửa code, chạy npm test và npm run test:ui
git push -u origin feature/ten-chuc-nang
```

Sau đó tạo Pull Request trên GitHub (hoặc extension **GitHub Pull Requests** trong VS Code) → đợi CI xanh → thử link preview → Merge. Merge xong CI tự deploy bản thật.

Lưu ý:

- Bản preview dùng chung Firestore với bản thật.
- Mọi PR dùng chung kênh `preview`, PR push sau cùng sẽ hiện trên đó.
- CI không deploy Firestore rules (xem mục 5).
