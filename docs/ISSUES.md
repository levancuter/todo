# Todo App - Vấn đề cần sửa

Ghi lại lỗi và điểm chưa ổn để sửa sau. Sửa xong thì chuyển trạng thái sang "Đã sửa" và ghi PR.

## 1. Dòng việc đang bấm giờ bị nhảy

- Ghi nhận: 09/10/2026
- Trạng thái: Đã sửa (nhánh `fix/row-layout`)
- Hiện tượng: Khi đồng hồ đang chạy, tên việc lúc xuống 2 dòng, lúc nằm 1 dòng. Ví dụ "Kiểm tra thao tác của 351 sau khi chỉnh sửa": lúc `0:06:46` tên bị xuống dòng, lúc `0:07:11` lại nằm 1 dòng.
- Nghi ngờ: Cột bên phải (đồng hồ, badge giờ, nút) đổi chiều rộng theo nội dung, nên phần tên co giãn theo. Có thể font Be Vietnam Pro không hỗ trợ số cùng độ rộng (`tabular-nums`), nên `1` hẹp hơn các số khác.
- Hướng sửa: Cố định chiều rộng cột đồng hồ và giờ, hoặc đưa đồng hồ xuống dòng nhãn bên dưới tên việc.
- Nguyên nhân thật: Be Vietnam Pro không có số cùng độ rộng, `tabular-nums` không tác dụng (`0:06:46` rộng 53.6px, `0:07:11` rộng 44.8px).
- Cách sửa: Đồng hồ chuyển xuống dòng nhãn, trong ô rộng cố định. Test: `tests/ui/layout.test.js`.

## 2. Cột giờ không thẳng hàng giữa các dòng

- Ghi nhận: 09/10/2026
- Trạng thái: Đã sửa (nhánh `fix/row-layout`)
- Hiện tượng: Số giờ (`0.5h`, `3h`, `0.1/1h`) mỗi dòng nằm một chỗ khác nhau. Dòng đã xong lệch sát phải, dòng chưa xong lệch vào trong, dòng đang bấm giờ lệch theo đồng hồ.
- Nguyên nhân: Phía sau số giờ, mỗi dòng có số nút khác nhau. Việc chưa xong có nút ▶, việc đã xong không có, việc Công việc đang chạy trong giờ làm thì không có nút ⏸. Số giờ bị đẩy theo.
- Hướng sửa: Chia dòng thành các cột cố định (grid): đồng hồ, giờ, nút bấm giờ, nút bỏ qua, nút xóa. Dòng nào không có nút thì giữ chỗ trống. Sửa cùng vấn đề 1.
- Cách sửa: Cột giờ rộng cố định, căn phải. Dòng không có nút ▶/⏸ hay Bỏ qua thì giữ chỗ trống (`.slot`). Test: `tests/ui/layout.test.js`.
