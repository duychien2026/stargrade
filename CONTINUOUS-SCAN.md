# Chấm camera liên tục

Lưu ý cập nhật 04/11/2026: theo yêu cầu người dùng, giao diện đang chạy đã quay về quy trình chụp từng ảnh trước khi thêm quét liên tục. Mô-đun quét liên tục dưới đây được giữ trong mã nguồn để tham khảo, không được tải vào giao diện hiện tại.

Trong Chấm phiếu, chọn **Chấm bằng camera**. Video chiếm toàn bộ vùng màn hình, các nút điều khiển nằm chồng lên ảnh. Canh các mốc đen đúng bốn khung nhỏ và giữ máy yên. Ảnh chụp chỉ lấy vùng trong khung, sau đó căn lại bằng bộ nhận dạng mẫu hiện có.

Mở nút bánh răng **Cấu hình khi chấm** để chọn chấm từng phiếu/chấm liên tục, tự chụp khi ổn định, tự lưu, âm báo hoặc rung. Mặc định chấm từng phiếu bằng nút Chụp phiếu; chụp xong mở ảnh và kết quả nhận dạng để kiểm tra trước khi lưu. Tự chụp có thể dùng ở cả hai chế độ. Các tùy chọn được nhớ trên trình duyệt. Không có điều khiển zoom. Đèn chỉ nằm trong cấu hình và chỉ hiện nếu camera hỗ trợ.

Tự chụp chỉ hoạt động khi đóng hộp cấu hình, kết quả ổn định qua nhiều khung hình, đủ mốc, đủ sáng và đạt kiểm tra độ nét. Nếu ảnh đầy đủ khác kết quả xem trước, chuyển sang kiểm tra thủ công.

- **Tự lưu phiếu rõ** chỉ lưu khi có mã đề và đáp án đầy đủ cho các phần được cấu hình. Các câu bỏ trống hoặc chưa rõ chuyển vào Cần kiểm tra. Người dùng có thể sửa và lưu thủ công, kể cả câu bỏ trống hợp lệ.
- Sau mỗi lần chụp, đưa phiếu cũ ra hẳn khung trước khi đưa phiếu tiếp theo vào. Một lần mất nét ngắn không mở lại lượt quét.
- Cảnh báo trùng cho phép xem bài cũ, thay thế khi chấm lại hoặc lưu thành phiếu khác. Không có SBD thì so nội dung; hai học sinh cùng nội dung vẫn có thể lưu riêng bằng lựa chọn rõ ràng.
- **Xem lại** mở trình sửa phiếu và các vòng đối chiếu. **Hoàn tác** bỏ lần lưu mới hoặc khôi phục bài trước khi thay thế. Phiếu đã sửa sau đó không bị hoàn tác bằng nút của lần lưu cũ.
- Số phiếu đã lưu và cần kiểm tra được đếm trong phiên trang hiện tại. Phiếu cần kiểm tra chưa được ghi lên máy chủ; lưu trước khi tải lại hoặc đóng trang.
- Âm báo và rung là tùy chọn; thiết bị/trình duyệt có thể không hỗ trợ. Thông báo kết quả trên camera tự ẩn sau 5 giây để tránh che phiếu.
- **Kết thúc** đóng camera và dừng các track video. Chỉ ảnh đã chụp được gửi khi lưu, không gửi luồng video.

Kiểm tra: PHP camera-submissions/submission-edit/regrade/exam-edit; Node scan-policy/key-editor và nhận dạng TNMaker/QM CV1239/Phú Thọ. Luồng giao diện được thử bằng video canvas mô phỏng trong kho dữ liệu riêng. Cần tiếp tục đối chiếu ảnh thật trên thiết bị; các kiểm tra chất lượng không đảm bảo nhận dạng 100% trong mọi điều kiện.
