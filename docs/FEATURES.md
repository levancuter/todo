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

## Phiên bản 4

### Hạn chót

- Đặt trong panel chi tiết, chỉ chọn ngày. Để trống là không có hạn.
- Chỉ cho việc không lặp lại. Bật lặp lại thì hạn chót bị xóa.
- Nhãn trong danh sách: `hạn 12/10` (xám), `hạn hôm nay` (cam), `quá hạn 07/10` (đỏ). Việc đã xong không hiện nhãn.

## Phiên bản 5

### Bỏ qua

Bỏ qua = đã lên kế hoạch nhưng quyết định không làm.

- Nút "Bỏ qua" trong panel chi tiết và trên mỗi việc (hiện khi rê chuột).
- Việc bị bỏ qua được đóng lại: không chuyển sang ngày sau, không tính vào tổng giờ.
- Hôm nay: vẫn hiện mờ trong danh sách với nhãn "bỏ qua" (giống việc đã xong).
- Lịch sử: hiện với nhãn "bỏ qua".
- Bấm nhầm thì "Hủy bỏ qua" trong ngày (giống bỏ tick việc đã xong).
- Việc lặp lại: chỉ bỏ qua ngày hôm đó, hôm sau vẫn tạo bình thường.
- Việc chưa xong giữ nguyên như Phiên bản 3: tự chuyển sang ngày tiếp theo, việc lặp lại chưa xong ghi "chưa xong" trong lịch sử.

### Giờ công

- Nhập giờ với bước 0.1h (ví dụ 0.1, 0.3, 1.2).
- Tab Công việc: tổng giờ so với 8 tiếng/ngày, ví dụ `6.5h / 8h`, có thanh tiến độ. Cảnh báo khi vượt 8h.
- Badge giờ hiện `thực tế/dự kiến`, ví dụ `1.5/2h`, màu đỏ nếu vượt dự kiến.
- Giờ thực tế sửa tay trong panel (bước 0.1h). Thẻ giờ hiện thêm tổng thực tế.

### Bấm giờ (giờ thực tế)

- Tự động trong giờ làm (T2–T6, 9h–12h, 13h–18h): luôn có một việc Công việc được bấm giờ, không cần bấm ▶.
  - Việc được chọn: việc Công việc chưa xong đầu tiên theo thứ tự ưu tiên.
  - Mở app muộn: tính từ đầu ca (9h hoặc 13h). Nếu trong ca đã có việc được bấm giờ thì tính từ lúc bắt đầu.
  - 12h tự tạm dừng, 13h chạy lại đúng việc đang làm lúc 12h. 18h dừng.
  - Không có nút tạm dừng cho việc Công việc trong giờ làm. Bấm ▶ việc khác để chuyển.
- Việc Cuộc sống và ngoài giờ làm: bấm ▶ / ⏸ bằng tay.
- Mỗi lúc chỉ một việc chạy; bắt đầu việc khác thì việc đang chạy tự dừng.
- Việc đang chạy hiện ngay trên danh sách: chấm nhấp nháy và đồng hồ. Không có thanh "Đang làm" riêng.
- Tự chuyển việc: tick xong (trên danh sách hoặc trong panel) hoặc bỏ qua việc đang chạy thì giờ được lưu và tự bắt đầu việc tiếp theo trong danh sách (theo thứ tự ưu tiên, bỏ qua việc đã xong / bỏ qua). Hết việc thì dừng.
- Chỉ chuyển trong cùng loại (Công việc hoặc Cuộc sống).
- Quên tắt: việc Công việc tự dừng lúc 12h và 18h, mọi việc tự dừng lúc 0h.
- Giờ thực tế vẫn sửa tay được trong panel (bước 0.1h) để chỉnh khi bấm sai. Ô này khóa khi đồng hồ đang chạy.
- Panel có nút Bắt đầu / Tạm dừng (trừ việc Công việc trong giờ làm) và đồng hồ đang chạy.
- Tải lại trang hoặc mở trên máy khác vẫn thấy đồng hồ đang chạy.

### Task con

- Chia một việc thành các bước nhỏ dạng checklist, quản lý trong panel chi tiết: thêm (Enter), sửa tên, tick, xóa, kéo thả sắp xếp.
- Danh sách hiện tiến độ trên việc cha, ví dụ `☑ 2/5`.
- Task con không có giờ, hạn chót hay bấm giờ riêng; những thứ đó vẫn tính trên việc cha.
- Tick hết task con không tự đánh dấu xong việc cha, chỉ gợi ý "Đã xong hết bước, đánh dấu xong?".
- Việc chưa xong chuyển sang ngày sau thì giữ nguyên trạng thái task con.
- Việc lặp lại: task con thuộc mẫu, mỗi ngày tạo lại với tất cả bước chưa tick. Thêm, xóa, đổi tên task con của việc hôm nay thì cập nhật luôn mẫu; tick chỉ áp dụng cho ngày đó.

### Tab theo giờ làm

- Bước vào giờ làm (9h, 13h) thì tự chuyển sang tab Công việc, ra khỏi giờ làm (12h, 18h) thì sang tab Cuộc sống.
- Giữa các mốc đó vẫn đổi tab bằng tay được.

### Xem chi tiết trong lịch sử

- Bấm vào việc trong lịch sử để mở panel chi tiết ở chế độ chỉ xem: mọi ô bị khóa, không có nút hành động hay xóa.

### Giao diện

- Chuyển giao diện sang React (xem ARCHITECTURE mục Định hướng). Chức năng giữ nguyên.
- Mở panel chi tiết không làm lệch danh sách: panel trượt vào từ bên phải, đè lên phần trống.
- Thay thanh tab bằng nút gạt nhỏ `Công việc | Cuộc sống` ở đầu trang. Bỏ tab Tất cả (chưa cần).
- Thiết kế lại cho đẹp hơn:
  - Mỗi việc 2 dòng: tên ở trên, nhãn (hạn, lặp lại, từ ngày) ở dưới.
  - Thanh tiến độ giờ thay cho dòng chữ tổng giờ.
  - Khoảng cách, cỡ chữ, màu sắc thống nhất; giữ chế độ sáng/tối.

## Phiên bản 6 (đang thiết kế)

Lập kế hoạch theo 3 tầng cố định (kiểu WBS): **Tháng → Tuần → Ngày**.

```
Mục tiêu (tháng 10)    Hoàn thành hệ thống báo cáo quý       40h
├─ Hạng mục (tuần 41)  Thiết kế                              12h
│   ├─ Việc T2 06/10   Phân tích yêu cầu                      3h
│   └─ Việc T3 07/10   Vẽ màn hình                            4h
└─ Hạng mục (tuần 42)  Lập trình                             20h
```

### Mục tiêu (tháng)

- Tạo mục tiêu: tên, mô tả ngắn, tháng, loại (Công việc hoặc Cuộc sống, tùy mục tiêu).
- Mỗi mục tiêu chia thành hạng mục theo tuần, mỗi hạng mục chia thành việc theo ngày.
- Tiến độ ở mục tiêu và từng hạng mục: số việc xong, giờ thực tế so với dự kiến.

### Việc (ngày)

- Chính là các việc hằng ngày đang có (bấm giờ, bỏ qua, task con giữ nguyên), thêm ngày dự định làm.
- Việc có ngày dự định ở tương lai chưa hiện ở Hôm nay, đến đúng ngày mới hiện. Chưa xong thì vẫn chuyển sang ngày sau như cũ.

### Màn hình Tuần

- Mỗi ngày một cột: các việc trong ngày và tổng giờ so với giờ trống. Cảnh báo ngày bị quá giờ.
- Kéo việc sang cột khác để dời ngày.

### Tự xếp ngày

- App (không phải AI) xếp việc vào ngày theo giờ trống, giữ thứ tự hạng mục và việc; việc của hạng mục tuần nào xếp vào tuần đó.
- Giờ trống mỗi ngày:
  - Công việc: T2–T6, 8h trừ việc đã có.
  - Cuộc sống: mặc định 2h/ngày cả tuần (chỉnh được sau).
- Tuần không đủ giờ: báo trước, cho chọn dời phần dư sang tuần sau.
- Nút "Xếp lại": khi bị trễ, xếp lại các việc chưa xong bắt đầu từ hôm nay.

### Chia việc bằng AI (Gemini)

- Nút "Chia việc bằng AI" trong mục tiêu: Gemini đề xuất hạng mục theo tuần và việc nhỏ kèm giờ dự kiến.
- Chỉ gửi cho Gemini mô tả đơn giản: tên và mô tả ngắn của mục tiêu, tháng, số tuần, giờ trống. Không gửi ghi chú hay các việc khác.
- Xem lại, sửa trước khi lưu. Lưu xong thì app tự xếp ngày.

### Lộ trình

| Bước | Nội dung | Cần AI |
|---|---|---|
| 6a | Ngày dự định + màn hình Tuần (lập kế hoạch tay) | Không |
| 6b | Mục tiêu và hạng mục nhập tay, tiến độ, tự xếp ngày | Không |
| 6c | Gemini chia việc, bật App Check | Có |

## Dự kiến
- Nhập nhanh giờ khi tạo việc, ví dụ `Viết báo cáo ~2h`
- Ghi chú dạng nhật ký (nhiều ghi chú có thời gian)
- Lọc: tất cả / đang làm / đã xong
- Nhóm hoặc tag
- Xuất/nhập JSON để sao lưu
- Đồng bộ nhiều thiết bị
