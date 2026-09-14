# Khu Tự Trị Noel Nguyễn - Web Chat Phong Cách Discord

Ứng dụng web chat thời gian thực tối giản nhưng đầy đủ tính năng hiện đại, giao diện chuẩn Discord Dark Mode.

## 🚀 Các tính năng chính

1. **Giao diện chuẩn Discord Dark Mode**:
   - Tông màu tối Discord (`#313338`, `#2B2D31`, `#1E1F22`).
   - Cột máy chủ, kênh chat, danh sách thành viên online trực tiếp.
   - Âm thanh thông báo khi có tin nhắn mới (Web Audio Synth).

2. **Một phòng chat bảo mật duy nhất**:
   - Người dùng không cần tạo tài khoản hay mật khẩu cá nhân phức tạp.
   - Chỉ cần nhập **Biệt danh (Username)** và **Mật khẩu phòng (Passcode)** để vào chat.
   - Mật khẩu phòng mặc định: `noelnguyen` (có thể đổi qua biến môi trường `ROOM_PASSCODE`).

3. **Cơ chế Quản trị viên (Admin Noel Nguyễn)**:
   - Nút **Admin 👑** nổi bật ở góc trên màn hình.
   - Nhập mật khẩu **`2412`** để kích hoạt quyền Quản trị viên tối cao.
   - Sau khi kích hoạt:
     - Nhận huy hiệu **`👑 ADMIN`** phong cách Discord bên cạnh tên.
     - Quyền xóa bất kỳ tin nhắn nào (nút thùng rác 🗑️ trên tin nhắn).
     - Quyền dọn sạch toàn bộ phòng chat (Nút "Dọn chat").

4. **Gửi File và Ảnh nặng/nhẹ không giới hạn**:
   - Cho phép tải lên hình ảnh, video, tài liệu, tệp nén zip (hỗ trợ tối đa 2GB).
   - Có **thanh phần trăm tiến trình (Upload Progress Bar %)** khi tải file lớn lên server.
   - Xem ảnh phóng to toàn màn hình (Lightbox) kèm nút tải về.
   - Thẻ hiển thị tệp tin đính kèm chuẩn Discord.
   - Hỗ trợ kéo thả tập tin (Drag & Drop) trực tiếp vào cửa sổ chat.

---

## 🛠️ Hướng dẫn cài đặt và khởi chạy

### Yêu cầu
- Đã cài đặt **Node.js** (v18 trở lên).

### Các bước chạy:
1. Mở Terminal / PowerShell tại thư mục dự án:
   ```powershell
   cd C:\Users\Phuc\.gemini\antigravity\scratch\discord-lite-chat
   ```

2. Cài đặt các thư viện cần thiết:
   ```powershell
   npm install
   ```

3. Khởi động server:
   ```powershell
   npm start
   ```

4. Truy cập trên trình duyệt:
   👉 **http://localhost:3000**

---

## 🔑 Thông tin đăng nhập mặc định
- **Mật khẩu phòng**: `noelnguyen`
- **Mật khẩu Admin**: `2412`
