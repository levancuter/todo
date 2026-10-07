# Todo App - Tài liệu chức năng

## Mục tiêu
Ứng dụng todo cá nhân, đơn giản, dùng được ngay.

## Công nghệ
- Một file `index.html` (HTML + CSS + JavaScript thuần).
- Lưu dữ liệu bằng `localStorage`.
- Không cần cài đặt, không cần server: mở file trong trình duyệt là dùng được.

## Dữ liệu
```js
{
  id: string,        // định danh duy nhất
  text: string,      // nội dung công việc
  done: boolean,     // đã hoàn thành hay chưa
  createdAt: number  // thời điểm tạo (timestamp)
}
```

## Chức năng - Phiên bản 1 (MVP)
| # | Chức năng | Mô tả | Trạng thái |
|---|-----------|-------|------------|
| 1 | Thêm việc | Nhập nội dung, nhấn Enter để thêm. Bỏ qua nội dung rỗng. | Chưa làm |
| 2 | Hoàn thành | Tick checkbox để đánh dấu xong, việc đã xong hiển thị gạch ngang. | Chưa làm |
| 3 | Xóa việc | Nút xóa trên từng việc. | Chưa làm |
| 4 | Tự động lưu | Mọi thay đổi được lưu vào `localStorage`, tải lại trang không mất dữ liệu. | Chưa làm |

## Chức năng dự kiến (các phiên bản sau)
- Sửa nội dung việc
- Lọc: tất cả / đang làm / đã xong
- Hạn chót (deadline)
- Mức độ ưu tiên
- Nhóm hoặc tag
- Xuất/nhập JSON để sao lưu
- Đồng bộ nhiều thiết bị

## Quy ước
- Khi hoàn thành một chức năng, cập nhật cột "Trạng thái" trong bảng.
- Chức năng mới được thêm vào mục "Chức năng dự kiến" trước khi phát triển.
