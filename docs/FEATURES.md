# Todo App - Chức năng

## Phiên bản 1 (MVP)

- Thêm việc: nhập nội dung, nhấn Enter để thêm. Bỏ qua nội dung rỗng.
- Hoàn thành: tick checkbox để đánh dấu xong, việc đã xong hiển thị gạch ngang.
- Xóa việc: nút xóa trên từng việc.
- Tự động lưu: tải lại trang không mất dữ liệu.
- Sắp xếp ưu tiên: kéo thả bằng tay cầm ⋮⋮, việc ở trên ưu tiên cao hơn. Dùng được cả chuột và cảm ứng.

## Phiên bản 2

### Giờ công

- Giờ dự kiến: mỗi việc mặc định 3h (kể cả việc cũ), sửa trong panel chi tiết, bước 0.5h.
- Badge giờ: hiện bên phải mỗi việc, ví dụ `3h`.
- Thanh tổng giờ: dưới ô thêm việc, tự cập nhật. Ví dụ `Tổng 9h · Còn 6h · Xong 3h`.

### Chi tiết việc

- Mở: bấm vào nội dung việc, panel hiện bên phải. Điện thoại thì mở toàn màn hình.
- Nội dung panel: sửa tên, tick hoàn thành, giờ dự kiến, ghi chú, ngày tạo, nút xóa.
- Tự lưu khi ngừng gõ, hiện "Đang lưu..." / "Đã lưu".
- Đóng: nút ✕, phím Esc, hoặc bấm lại việc đang mở. Việc bị xóa thì panel tự đóng.

## Phiên bản 3

### Làm mới mỗi ngày

- Qua ngày mới (0h): việc đã xong được cất vào lịch sử, việc chưa xong chuyển sang hôm nay.
- Việc chuyển từ hôm trước có nhãn nhỏ, ví dụ `từ 07/10`.
- Tự làm mới khi mở app, không cần bấm gì.
- Lịch sử: thanh chọn ngày `← Hôm nay →`, xem việc đã xong và tổng giờ của từng ngày.

### Việc lặp lại

- Đặt trong panel chi tiết: Không / Hằng ngày / T2–T6 / Chọn thứ.
- Đến ngày phù hợp, app tự tạo việc mới từ mẫu (tên, giờ dự kiến, loại). Việc lặp lại có nhãn 🔁.
- Việc lặp lại hôm trước chưa xong: lịch sử ghi là "chưa xong" cho ngày đó, hôm nay chỉ hiện một việc duy nhất.
- Ngày không mở app thì không tạo bù.
- Sửa mẫu áp dụng từ lần tạo sau. Tắt lặp lại thì việc của hôm nay vẫn giữ.

### Công việc và Cuộc sống

- Mỗi việc thuộc một loại: Công việc hoặc Cuộc sống. Việc cũ tính là Công việc.
- Giờ làm việc: thứ 2 đến thứ 6, 9h–12h và 13h–18h (8 tiếng, nghỉ trưa 12h–13h).
- Tab `Công việc | Cuộc sống | Tất cả`. Trong giờ làm app tự mở tab Công việc, ngoài giờ mở tab Cuộc sống.
- Ngoài giờ làm, việc Công việc vẫn hiện bình thường, chỉ đổi tab mặc định.
- Việc mới thuộc loại của tab đang mở. Ở tab Tất cả thì theo giờ hiện tại.
- Tab Công việc so giờ việc còn lại với giờ làm còn lại hôm nay, ví dụ `Còn 6h việc · còn 3h làm việc`. Hiện màu cảnh báo nếu không kịp.
- Việc lặp lại loại Công việc chỉ tạo vào thứ 2 đến thứ 6.

## Dự kiến

- Giờ thực tế (so sánh với giờ dự kiến)
- Nhập nhanh giờ khi tạo việc, ví dụ `Viết báo cáo ~2h`
- Ghi chú dạng nhật ký (nhiều ghi chú có thời gian)
- Lọc: tất cả / đang làm / đã xong
- Hạn chót
- Nhóm hoặc tag
- Xuất/nhập JSON để sao lưu
- Đồng bộ nhiều thiết bị
