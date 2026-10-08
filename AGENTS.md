# AGENTS.md

## 1. General Rules
- Viết code đơn giản, dễ đọc và dễ bảo trì.

## 2. Coding
- Chỉ thêm comment khi logic khó hiểu hoặc cần giải thích.
- Comment bằng tiếng Anh, ngắn gọn, đơn giản.

## 3. Documentation
- Viết tài liệu đơn giản, chỉ ghi ý chính.

## 4. Test
- Phải test trước khi bàn giao.

## 5. Version control
- Mọi thay đổi làm trên nhánh riêng, kể cả sửa nhỏ. Không commit trực tiếp vào `main`.
- Tên nhánh: `feature/...` (chức năng), `fix/...` (sửa lỗi), `docs/...` (tài liệu).
- Xong thì push nhánh và tạo Pull Request vào `main`. CI pass mới merge.
- Merge vào `main` thì CI tự deploy bản thật.
