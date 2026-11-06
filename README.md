# 🌟 StarGrade - Hệ Thống Chấm Phiếu Trắc Nghiệm Thông Minh

Nền tảng chấm phiếu trắc nghiệm trực tuyến thế hệ mới, hỗ trợ giáo viên chấm bài tự động bằng **Camera điện thoại** hoặc tải ảnh phiếu thi lên, tích hợp thuật toán xử lý ảnh quang học OMR (Optical Mark Recognition) thuần JavaScript tốc độ cao (30ms - 180ms/phiếu).

---

## 🚀 Tính Năng Nổi Bật

- **📷 Chấm bằng Camera điện thoại:** Tự động bắt 4 mốc đen ở 4 góc, nắn phối cảnh (Homography transform), tự động bù sáng và chấm điểm tức thì.
- **⚡ Chế độ chấm liên tục:** Tự động lưu phiếu rõ nét và giữ nguyên màn hình để lật bài chấm liên tục không cần chạm tay vào màn hình.
- **📋 Hỗ trợ 8 mẫu phiếu thi chuẩn:**
  1. `TNMaker-BGD-2025-CV1239` (40 câu P1, 8 câu P2, 6 câu P3, SBD 8 số, Mã đề 4 số)
  2. `BGD-2025-CV1239-Đen` (Mẫu đen trắng chính thức)
  3. `BGD-2025-CV1239-Hồng` (Mẫu giấy hồng chống gian lận)
  4. `QM-40 Ngang-ABCD` (40 câu ngang)
  5. `QM-BGD-2025-CV1239` (Mẫu QM Bộ GD)
  6. `QM2025-CV4 Ngang` (12 câu P1, 4 câu P2, 6 câu P3)
  7. `HSG-Phú Thọ-2025` (50 câu P1, 10 câu P2, 12 câu P3)
  8. `TNMaker-40 Ngang-ABCD`
- **📥 Nhập đáp án thông minh:**
  - Nhập qua file Excel mẫu.
  - Chụp ảnh phiếu đáp án đã tô sẵn bằng camera.
  - Quét mã QR đáp án bằng camera hoặc tải ảnh QR.
  - Bấm chọn trực tiếp hoặc dán chuỗi đáp án.
- **👥 Quản lý học sinh & Xuất điểm:**
  - Nhập danh sách lớp bằng file CSV (SBD, Họ tên, Lớp).
  - Tự động ghép tên học sinh theo SBD.
  - Thống kê phổ điểm: Điểm trung bình, cao nhất, thấp nhất, cảnh báo bài tô lỗi.
  - Xuất bảng điểm định dạng CSV theo bài hoặc theo lớp (hỗ trợ tiếng Việt UTF-8 BOM chuẩn cho Excel).
- **📱 Đa nền tảng:**
  - Chạy trên mọi trình duyệt Web (Chrome, Safari, Cốc Cốc, Edge).
  - Hỗ trợ **PWA (Progressive Web App)**: Cài đặt vào màn hình chính điện thoại, mở toàn màn hình không có thanh URL.
  - Hỗ trợ **Native Android App**: Mã nguồn Android Studio đi kèm trong thư mục `android/`.

---

## 🛠️ Hướng Dẫn Chạy Cục Bộ (Local PC)

Yêu cầu: Máy tính đã cài đặt **PHP 8.2 trở lên**.

Chỉ cần nhấp đúp chuột vào file:
```
CHAY-THU-LOCAL.bat
```
Hoặc mở terminal và chạy lệnh:
```bash
php -S 0.0.0.0:8090 -t public
```
Truy cập ứng dụng tại: `http://localhost:8090` (hoặc `http://<IP_LAN>:8090` trên điện thoại cùng mạng WiFi).

---

## ☁️ Triển Khai Hosting Miễn Phí (Có HTTPS cho Camera)

Dự án đã có sẵn cấu hình `Dockerfile` và `render.yaml`.
1. Đăng ký tài khoản tại [Render.com](https://render.com) (chọn **Sign in with GitHub**).
2. Chọn **New +** -> **Web Service** -> Chọn repository `stargrade`.
3. Chọn gói **Free** -> Bấm **Create Web Service**.
4. Ứng dụng sẽ được triển khai tự động với chứng chỉ bảo mật HTTPS (bắt buộc để trình duyệt cấp quyền mở Camera điện thoại).

---

## 📱 Cài Đặt Trên Điện Thoại Android

- **Cách 1 (Nhanh nhất - PWA):** Mở link hosting trên Chrome điện thoại, bấm dấu **3 chấm dọc** -> Chọn **"Cài đặt ứng dụng"** (hoặc *Thêm vào màn hình chính*).
- **Cách 2 (Android Studio):** Mở thư mục `android/` bằng Android Studio, bấm **Build APK** để tạo file `.apk` cài đặt trực tiếp.
