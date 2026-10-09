# Todo App - Kiến trúc

## Mục tiêu

- Dùng trên nhiều thiết bị qua trình duyệt.
- Chỉ dùng dịch vụ miễn phí.

## Công nghệ

- Frontend: HTML/CSS/JS thuần, build bằng Vite. Sẽ chuyển sang React (xem mục Định hướng).
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
  category: string   // "work" | "life", mặc định "work"
  doneDate: string | null   // ngày hoàn thành "YYYY-MM-DD", null nếu chưa xong
  routineId: string | null  // mẫu lặp lại tạo ra việc này
  date: string | null       // ngày của việc lặp lại "YYYY-MM-DD"
  deadline: string | null   // hạn chót "YYYY-MM-DD", chỉ việc không lặp lại
  skipped: boolean          // bỏ qua: luôn đi kèm done = true
  actualSeconds: number     // giờ thực tế đã cộng dồn, tính bằng giây
  timerStartedAt: timestamp | null  // đang bấm giờ từ lúc này, null nếu không chạy
  subtasks: { id, text, done }[]    // task con dạng checklist

users/{uid}/routines/{routineId}    // mẫu việc lặp lại
  text: string
  estimate: number
  category: string
  days: number[]     // thứ trong tuần, 0 = CN ... 6 = T7
  subtasks: { id, text }[]  // các bước, mỗi ngày tạo lại chưa tick
  lastCreated: string       // ngày gần nhất đã tạo việc "YYYY-MM-DD"
  createdAt: timestamp

users/{uid}/meta/app                // cờ nâng cấp dữ liệu
  migratedV3: boolean
```

- Kéo thả: `order` mới = trung bình `order` của 2 việc liền kề, chỉ ghi 1 document.
- Việc cũ chưa có `order` dùng `createdAt` thay thế.
- Field mới thiếu ở việc cũ thì dùng mặc định: `estimate` 3, `note` `""`, `category` `"work"`, `skipped` false, `actualSeconds` 0, `subtasks` `[]`. Không cần migrate.
- Giờ dự kiến làm tròn bước 0.1h. Cộng số thập phân có sai số (0.1 + 0.2), nên tổng giờ làm tròn 1 chữ số khi hiển thị.
- Ngày luôn tính theo giờ máy người dùng, dạng chuỗi `YYYY-MM-DD`.

## Chi tiết việc

- `TodoView.jsx` giữ `selectedId` (việc đang mở). Panel đọc dữ liệu từ danh sách `todos` hiện có, không tải thêm.
- Sửa trong panel: ghi bằng `updateDoc` sau khi ngừng gõ ~500ms.
- Khi Firestore gửi dữ liệu mới, không ghi đè ô đang được gõ (đang có focus).
- `selectedId` không còn trong `todos` (bị xóa) thì đóng panel.
- Tổng giờ tính trên client từ `todos`, không lưu vào Firestore.

## Cấu trúc giao diện (React)

- React 19, build bằng Vite (`@vitejs/plugin-react`).
- `main.jsx` → `App.jsx` (đăng nhập, thanh trên cùng, nút gạt loại việc) → `TodoView.jsx` (ngày, danh sách, lịch sử, việc lặp lại) → `HoursCard.jsx`, `TodoItem.jsx`, `DetailPanel.jsx`.
- `Icon.jsx`: icon SVG nét mảnh dùng chung, không dùng emoji.
- Màu theo loại đang xem: `.app[data-tab]` đặt biến CSS `--cat` (tím chàm cho Công việc, xanh mòng két cho Cuộc sống). Có chế độ tối.
- Panel chi tiết `position: fixed` đè lên bên phải, không đổi bố cục danh sách. Điện thoại: phủ toàn màn hình.
- `hooks.js`: `useNow` (cập nhật mỗi phút và khi quay lại tab), `useTodos`, `useRoutines` (listener Firestore).
- Các module logic thuần và `todos.js` không phụ thuộc React.
- Kéo thả vẫn dùng `drag.js` (thao tác DOM trực tiếp). Thả xong, `TodoView` cập nhật thứ tự rồi xóa `transform` của các dòng.
- React giữ phần tử DOM theo `key`, nên dữ liệu mới về giữa lúc bấm không làm mất cú bấm.
- Panel gọi `flush()` (lưu ngay) khi đóng, `discard()` (bỏ chỉnh sửa) khi việc bị xóa, qua `ref`.

## Làm mới mỗi ngày

Gói Spark không có tác vụ hẹn giờ trên server, nên không "dọn" dữ liệu lúc 0h. Danh sách được tính theo ngày, bằng query (xem mục Tải dữ liệu):

- Hôm nay = việc chưa xong + việc có `doneDate` = hôm nay. Không tính việc lặp lại của ngày trước (lọc trên client).
- Lịch sử ngày D = việc có `doneDate` = D + việc lặp lại có `date` = D mà chưa xong (ghi "chưa xong").
- Tick xong thì ghi `doneDate` = hôm nay, bỏ tick thì ghi `null`.
- Nhãn `từ 07/10`: việc chưa xong có `createdAt` trước hôm nay.
- Mỗi phút và khi quay lại tab (`visibilitychange`), app kiểm tra xem đã sang ngày mới chưa. Sang ngày mới thì đăng ký lại listener `doneDate`.
- Lịch sử chỉ để xem, không sửa.
- Việc cũ đã xong chưa có `doneDate` thì không query được. Lần đầu chạy v3, app gán `doneDate` theo ngày `createdAt` cho các việc này (vài chục document), rồi lưu cờ vào `users/{uid}/meta/app` để không chạy lại.

## Tải dữ liệu

Gói Spark giới hạn 50.000 lượt đọc và 20.000 lượt ghi mỗi ngày. Cách tính lượt đọc:

- Listener tốn 1 lượt đọc cho mỗi document trả về, và 1 lượt cho mỗi document thay đổi.
- Mất kết nối hơn 30 phút (đóng app, tắt máy) thì lần mở sau bị tính đọc lại toàn bộ kết quả, dù có cache offline.

Nếu tải toàn bộ todos, lịch sử tăng mỗi ngày nên sau khoảng 6 tháng sẽ vượt hạn mức. Vì vậy chỉ tải phần cần hiển thị:

| Dữ liệu | Cách tải |
|---|---|
| Việc chưa xong | listener `where("done", "==", false)` |
| Việc xong hôm nay | listener `where("doneDate", "==", hôm nay)` |
| Mẫu lặp lại | listener toàn bộ `routines` (ít document) |
| Lịch sử ngày D | đọc một lần `where("doneDate", "==", D)` và `where("date", "==", D)` khi mở ngày đó |

- Tick một việc làm nó chuyển từ query này sang query kia, cả hai listener đều báo, mỗi cái trong một task riêng. `watchTodos` đợi cả hai rồi mới gọi callback, nếu không thì giữa chừng việc đó trông như bị xóa.
- Mỗi lần mở app chỉ đọc khoảng 20–30 document. Ước tính khoảng 1.000–2.000 lượt đọc mỗi ngày, không tăng theo thời gian.
- Chỉ dùng điều kiện `==` trên một field, Firestore tự có index, không cần tạo composite index.
- Ghi: tick, kéo thả, tự lưu, tạo việc lặp lại khoảng vài trăm lượt mỗi ngày.

## Việc lặp lại

- Đặt lặp lại cho một việc: tạo document trong `routines`, rồi gán `routineId` và `date` = hôm nay cho việc đó.
- Mỗi lần mở app hoặc sang ngày mới: tạo việc cho mẫu có thứ hôm nay trong `days` và `lastCreated` < hôm nay. Mẫu Công việc bỏ qua thứ 7, CN.
- Tạo việc và ghi `lastCreated` = hôm nay trong cùng một batch. Dựa vào `lastCreated` chứ không dựa vào danh sách việc, nên xóa việc lặp lại của hôm nay thì không bị tạo lại.
- Việc tạo từ mẫu có ID cố định `{routineId}_{date}`. Hai thiết bị cùng tạo thì ghi vào cùng một document, không bị trùng.
- Chỉ tạo khi dữ liệu đã tải từ server (`snapshot.metadata.fromCache` = false). Nếu tạo dựa trên cache cũ, thiết bị có thể ghi đè việc đã tick xong trên máy khác.
- Sửa tên, giờ hoặc loại của việc lặp lại hôm nay thì cập nhật luôn mẫu.
- Tắt lặp lại: xóa document mẫu. Các việc đã tạo vẫn giữ nguyên.

## Công việc và Cuộc sống

- Giờ làm cố định trong code: thứ 2 đến thứ 6, `9–12` và `13–18`.
- `isWorkTime(now)`: đang trong giờ làm hay không. Dùng để chọn loại mặc định khi mở app.
- `WORK_HOURS_PER_DAY` = 8: tab Công việc so tổng giờ dự kiến với con số này.
- `workHoursLeft(now)`: số giờ làm còn lại hôm nay, không tính nghỉ trưa. Ví dụ 11h còn 6h, 12h30 còn 5h, sau 18h hoặc cuối tuần còn 0h.
- Cảnh báo khi giờ việc Công việc còn lại > `workHoursLeft`.
- Loại đang xem chỉ lưu trên máy (state trong `App.jsx`), không lưu Firestore. Việc mới thuộc loại đang xem.

## Bỏ qua

- Bỏ qua ghi `done: true, skipped: true, doneDate: hôm nay`. Nhờ vậy dùng lại 2 query hiện có: hôm nay vẫn thấy (`doneDate` = hôm nay), không chuyển sang ngày sau (`done` = true), lịch sử tìm được.
- Hủy bỏ qua ghi `done: false, skipped: false, doneDate: null`, giống bỏ tick.
- Tổng giờ và giờ còn lại không tính việc `skipped`.

## Bấm giờ

- Đồng hồ lưu trên todo: `timerStartedAt` là lúc bắt đầu. Thời gian đang chạy = bây giờ − `timerStartedAt`, tính trên máy và cập nhật mỗi giây, không ghi Firestore mỗi giây.
- Dừng: `actualSeconds += bây giờ − timerStartedAt`, `timerStartedAt = null`. Mỗi lần bắt đầu hoặc dừng chỉ 1 lượt ghi.
- Chỉ một việc chạy: bắt đầu việc mới thì dừng việc cũ và chạy việc mới trong cùng một batch.
- Tự chuyển việc: tick xong hoặc bỏ qua việc đang chạy thì trong cùng một batch: dừng và đóng việc đó, đặt `timerStartedAt` cho việc chưa xong đầu tiên (theo `order`) cùng loại.
- Tự dừng khi quên tắt: khi mở app và mỗi phút, nếu việc đang chạy đã qua mốc dừng (việc Công việc: 12h, 18h; mọi việc: 0h) thì dừng tại đúng mốc đó. Máy nào mở app trước thì ghi; hai máy cùng ghi ra cùng kết quả.
- Việc đang chạy luôn là việc chưa xong, nằm trong listener `done == false`, nên mọi thiết bị đều thấy đồng hồ mà không cần query thêm.
- Sửa tay giờ thực tế trong panel: ghi `actualSeconds` = số giờ nhập × 3600.

## Task con

- Lưu thành mảng `subtasks` trong document của việc, không tạo document riêng, nên không tốn thêm lượt đọc.
- Mỗi task con có `id` riêng (tạo trên máy) để sửa và kéo thả không nhầm phần tử.
- Mỗi lần sửa ghi lại cả mảng. Sửa cùng một việc trên 2 máy cùng lúc thì lần ghi sau thắng; chấp nhận được vì dùng một mình.
- Việc lặp lại: mẫu giữ danh sách bước (`id`, `text`). Việc mỗi ngày copy từ mẫu với `done: false`. Thêm, xóa, đổi tên bước của việc hôm nay thì cập nhật mẫu; tick thì không.

## Bảo mật

Firestore rules: người dùng chỉ đọc/ghi dữ liệu dưới `users/{uid}` của chính mình.

```
match /users/{uid}/{document=**} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
```

## Định hướng

Phần giao diện sẽ chuyển sang **React**, vẫn build bằng Vite.

- Lý do: giao diện hiện thao tác DOM trực tiếp và vẽ lại cả danh sách mỗi lần có dữ liệu mới, dễ gây lỗi (mất cú bấm, ghi đè ô đang gõ). React cập nhật theo `key` nên giữ được phần tử DOM.
- Giữ nguyên: Firebase Hosting gói Spark, các module logic thuần (`hours`, `dates`, `category`, `daily`, `routines`, `order`), lớp dữ liệu `todos.js`, unit test, CI/CD.
- Viết lại: `main.js`, `detail.js`, `drag.js`, `index.html`.
- Giữ các `id` trong HTML để bộ test giao diện chạy được với bản React, dùng nó kiểm tra không mất chức năng.
- Chưa dùng Next.js: app chạy hoàn toàn trên trình duyệt (realtime, offline), không cần SSR hay SEO. Next.js đầy đủ cần server, phải lên gói trả phí. Xem lại khi có trang công khai hoặc cần logic phía server (vd gọi API có khóa bí mật).

## Ghi chú

- Mất mạng vẫn dùng được, có mạng lại tự đồng bộ.
- Thêm chức năng mới (hạn chót, tag...) bằng cách thêm field vào todo.