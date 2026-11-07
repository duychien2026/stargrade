# Hướng Dẫn Sử Dụng Extension StarGrade Trong MIT App Inventor

Extension **StarGrade.aix** cho phép bạn tự tạo ứng dụng chấm thi trắc nghiệm bằng Camera trên điện thoại thông qua môi trường kéo thả của **MIT App Inventor**, **Kodular** hoặc **Niotron**.

File extension nằm tại:
📂 `H:\AI-Gemini\StarGrade\extension\StarGrade.aix`
🔗 Link GitHub: `https://github.com/duychien2026/stargrade/raw/main/extension/StarGrade.aix`

---

## 1. Cách Nhập Extension Vào Dự Án
1. Mở dự án của bạn trên [MIT App Inventor](https://ai2.appinventor.mit.edu).
2. Ở cột công cụ bên trái (Palette), kéo xuống dưới cùng tìm mục **Extension**.
3. Bấm **Import extension** -> Chọn **Choose file** -> Chọn file `StarGrade.aix`.
4. Bấm **Import**.
5. Kéo component **StarGrade** từ bảng Extension vào màn hình thiết kế (`Screen1`). Component này là non-visible (chạy nền).

---

## 2. Các Thuộc Tính (Properties)
- **`ServerUrl`**: Địa chỉ máy chủ StarGrade. Mặc định là `https://starmind-exam.onrender.com` (hoặc link server riêng của bạn).
- **`Template`**: Mẫu phiếu thi muốn chấm. Các giá trị hợp lệ:
  - `bgd2`: Mẫu chuẩn Bộ GD&ĐT 2025
  - `bgd2025original`: Mẫu đen trắng
  - `bgd2025pink`: Mẫu giấy hồng
  - `qm40`: Mẫu 40 câu ngang
  - `qmcv4`: Mẫu QM CV4 ngang
  - `phutho`: Mẫu thi HSG Phú Thọ
  - `tnmaker40`: Mẫu TNMaker 40 câu
- **`ExamId`**: Số ID của bài kiểm tra trên hệ thống (mặc định: `1`).

---

## 3. Các Khối Lệnh (Blocks)

### A. Khối Hành Động (Functions)
- **`call StarGrade.GradeImage(imagePath)`**: Gọi hàm chấm bài thi bằng đường dẫn ảnh chụp.
- **`call StarGrade.GradeBase64(base64Image)`**: Chấm bài từ chuỗi ảnh base64.
- **`call StarGrade.Login(username, password)`**: Đăng nhập tài khoản giáo viên.
- **`call StarGrade.SaveSubmission(...)`**: Lưu kết quả bài thi học sinh lên máy chủ.

### B. Khối Sự Kiện (Events)
- **`when StarGrade.AfterGrading(studentNo, code, score, part1, part2, part3, success, errorMessage)`**:
  - Kích hoạt ngay khi chấm xong 1 bài thi!
  - `studentNo`: Số báo danh học sinh
  - `code`: Mã đề thi
  - `score`: Điểm số bài thi (số thập phân)
  - `part1`: Chuỗi đáp án Phần I
  - `part2`: Chuỗi đáp án Phần II
  - `part3`: Chuỗi đáp án Phần III
  - `success`: Đúng/Sai (True nếu chấm thành công, False nếu mờ/lỗi mốc)
  - `errorMessage`: Thông báo lỗi nếu thất bại

---

## 4. Kịch Bản Mẫu: Chụp Ảnh và Hiện Điểm Tức Thì

1. Trong giao diện Designer, thêm:
   - 1 nút bấm: `btnChupVaCham` (Text: "Chụp & Chấm bài")
   - 1 component: `Camera1` (trong mục Media)
   - 1 nhãn: `lblKetQua` (để hiện điểm)
   - 1 component: `StarGrade1` (trong mục Extension)

2. Trong mục Blocks, ghép các khối như sau:
   - **Khi bấm nút chụp:**
     ```
     when btnChupVaCham.Click do
       call Camera1.TakePicture
     ```
   - **Khi chụp ảnh xong, gửi sang StarGrade:**
     ```
     when Camera1.AfterPicture(image) do
       call StarGrade1.GradeImage(imagePath = image)
       set lblKetQua.Text to "Đang nhận dạng phiếu..."
     ```
   - **Khi StarGrade chấm xong, hiển thị kết quả:**
     ```
     when StarGrade1.AfterGrading(studentNo, code, score, part1, part2, part3, success, errorMessage) do
       if get success = true then
         set lblKetQua.Text to join("SBD: ", get studentNo, " - Điểm: ", get score)
       else
         set lblKetQua.Text to join("Lỗi: ", get errorMessage)
     ```

