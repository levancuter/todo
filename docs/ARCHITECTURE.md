# Todo App - Kiến trúc

## Mục tiêu

- Dùng trên nhiều thiết bị qua trình duyệt.
- Chỉ dùng dịch vụ miễn phí.

## Công nghệ

- Frontend: HTML/CSS/JS thuần, build bằng Vite.
- Đăng nhập: Firebase Auth (Google).
- Dữ liệu: Firestore, bật offline persistence.
- Hosting: Firebase Hosting (gói Spark miễn phí).

## Sơ đồ

```
Trình duyệt (điện thoại / máy tính)
  └── Web app (Vite)
        ├── Firebase Auth  -> đăng nhập Google
        └── Firestore      -> đọc/ghi todos, đồng bộ realtime
```

## Dữ liệu

```
users/{uid}/todos/{todoId}
  text: string
  done: boolean
  order: number      // nhỏ hơn = ưu tiên cao hơn (hiển thị trên)
  createdAt: timestamp
  estimate: number   // giờ dự kiến, mặc định 3
  note: string       // ghi chú, mặc định ""
```

- Kéo thả: `order` mới = trung bình `order` của 2 việc liền kề, chỉ ghi 1 document.
- Việc cũ chưa có `order` dùng `createdAt` thay thế.
- Việc cũ chưa có `estimate` tính là 3, chưa có `note` tính là `""`. Không cần migrate.

## Chi tiết việc

- `main.js` giữ `selectedId` (việc đang mở). Panel đọc dữ liệu từ danh sách `todos` hiện có, không tải thêm.
- Sửa trong panel: ghi bằng `updateDoc` sau khi ngừng gõ ~500ms.
- Khi Firestore gửi dữ liệu mới, không ghi đè ô đang được gõ (đang có focus).
- `selectedId` không còn trong `todos` (bị xóa) thì đóng panel.
- Tổng giờ tính trên client từ `todos`, không lưu vào Firestore.

## Bảo mật

Firestore rules: người dùng chỉ đọc/ghi dữ liệu dưới `users/{uid}` của chính mình.

```
match /users/{uid}/{document=**} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
```

## Ghi chú

- Mất mạng vẫn dùng được, có mạng lại tự đồng bộ.
- Thêm chức năng mới (hạn chót, tag...) bằng cách thêm field vào todo.
