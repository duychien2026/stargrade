# Hướng Dẫn Tải Lên GitHub & Triển Khai Hosting Miễn Phí (StarGrade)

## 1. Đăng ký tài khoản GitHub (1 phút)
1. Truy cập: [https://github.com/signup](https://github.com/signup)
2. Nhập Email, tạo Mật khẩu, chọn Tên tài khoản (Username).
3. Hoàn thành câu đố hình ảnh (CAPTCHA) và lấy mã xác thực gửi về Email để hoàn tất đăng ký.

---

## 2. Tạo Kho chứa (Repository) & Tải Code lên
1. Vào [https://github.com/new](https://github.com/new)
2. Điền **Repository name**: `stargrade`
3. Chọn chế độ: **Public**
4. Bấm **Create repository**
5. Ở trang mới, bấm **uploading an existing file**
6. Giải nén file `StarGrade-Complete.zip` rồi kéo toàn bộ các file/thư mục thả vào trình duyệt
7. Bấm **Commit changes**

---

## 3. Triển khai Web App Miễn Phí Trên Render (Có sẵn HTTPS cho Camera)
1. Truy cập [https://render.com](https://render.com)
2. Bấm **Sign In** -> Chọn **Sign in with GitHub**
3. Bấm **New +** (góc trên bên phải) -> Chọn **Web Service**
4. Chọn repository `stargrade` vừa tạo và bấm **Connect**
5. Cấu hình cơ bản:
   - **Name**: `stargrade-app`
   - **Region**: Singapore
   - **Branch**: `main`
   - **Plan**: Free ($0)
6. Bấm **Create Web Service**
7. Chờ 1-2 phút, Render sẽ cấp cho bạn đường link có HTTPS:
   `https://stargrade-app.onrender.com`

---

## 4. Chạy Thử Nhanh Trên Máy Tính
- Trong thư mục `H:\AI-Gemini\StarGrade`, chỉ cần nhấp đúp vào file `CHAY-THU-LOCAL.bat` để chạy máy chủ local tại địa chỉ:
  `http://localhost:8090`

