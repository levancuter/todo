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
  createdAt: timestamp
```

## Bảo mật

Firestore rules: người dùng chỉ đọc/ghi dữ liệu dưới `users/{uid}` của chính mình.

```
match /users/{uid}/{document=**} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
```

## Ghi chú

- Mất mạng vẫn dùng được, có mạng lại tự đồng bộ.
- Thêm chức năng mới (hạn chót, ưu tiên, tag) bằng cách thêm field vào todo.
