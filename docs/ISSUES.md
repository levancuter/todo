# Todo App - Vấn đề cần sửa

Ghi lại lỗi và điểm chưa ổn để sửa sau. Sửa xong thì chuyển trạng thái sang "Đã sửa" và ghi PR.

## 1. Dòng việc đang bấm giờ bị nhảy

- Ghi nhận: 09/10/2026
- Trạng thái: Chưa sửa
- Hiện tượng: Khi đồng hồ đang chạy, tên việc lúc xuống 2 dòng, lúc nằm 1 dòng. Ví dụ "Kiểm tra thao tác của 351 sau khi chỉnh sửa": lúc `0:06:46` tên bị xuống dòng, lúc `0:07:11` lại nằm 1 dòng.
- Nghi ngờ: Cột bên phải (đồng hồ, badge giờ, nút) đổi chiều rộng theo nội dung, nên phần tên co giãn theo. Có thể font Be Vietnam Pro không hỗ trợ số cùng độ rộng (`tabular-nums`), nên `1` hẹp hơn các số khác.
- Hướng sửa: Cố định chiều rộng cột đồng hồ và giờ, hoặc đưa đồng hồ xuống dòng nhãn bên dưới tên việc.
