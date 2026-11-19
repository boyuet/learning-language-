# 📱 TOEIC Vocabulary Pro (Web App & iOS Offline)

Ứng dụng học **2.372 từ vựng TOEIC** toàn diện, chuẩn giao diện Forest Emerald (`#15803d`) & Slate hiện đại, hỗ trợ chạy trực tiếp trên máy tính hoặc cài đặt làm **App độc lập trên iPhone / iPad (iOS)** học 100% Offline.

---

## 📂 Cấu Trúc Các File Trong Dự Án (Chuẩn Git)

Dự án đã được phân tách thành các file module độc lập, gọn gàng, sẵn sàng để đẩy lên GitHub:

| File / Thư mục | Chức năng |
| :--- | :--- |
| `index.html` | File giao diện chính: Hub chọn bài, Flashcard 3D, danh sách từ, 5 trò chơi và modal Thêm/Sửa từ. |
| `style.css` | Toàn bộ định dạng giao diện, bảng màu từng chuyên mục Xem thêm, hiệu ứng chuyển động và tương thích mobile. |
| `app.js` | Toàn bộ mã xử lý: Hệ thống hàng đợi SRS, 5 Game tương tác, phát âm TTS, lưu trữ tiến độ và bộ lọc tra cứu. |
| `vocab_data.js` | Dữ liệu 2.372 từ vựng kèm đầy đủ mục Xem thêm (Họ từ, Đồng nghĩa, Trái nghĩa, Cụm từ, Mẹo đề thi, Part). |
| `manifest.json` | Cấu hình Progressive Web App (PWA) để cài đặt toàn màn hình lên iOS/Android. |
| `sw.js` | Service Worker nạp cache vĩnh viễn trên thiết bị để chạy Offline không cần mạng. |
| `apple-touch-icon.png` | Icon ứng dụng chất lượng cao dành riêng cho màn hình chính iPhone / iPad. |
| `icon-192.png`, `icon-512.png` | Icon chuẩn PWA cho Android và Desktop. |
| `server.py` | Máy chủ mini chạy cục bộ, tự động nhận diện IP Wi-Fi và tạo mã QR để iPhone quét kết nối. |
| `build_ios_bundle.py` | Script Python đóng gói toàn bộ ứng dụng thành 1 file HTML duy nhất. |
| `Chay_App_Va_Cai_iOS.bat` | File chạy nhanh 1-click trên máy tính Windows. |
| `dist/TOEIC_Vocab_iOS_Offline.html` | Bản đóng gói 1 file duy nhất (~2.4 MB) chứa sẵn dữ liệu để mở trực tiếp trong app **Tệp (Files)** trên iOS. |
| `.gitignore` | Bỏ qua các file cache, dependencies không cần thiết khi đẩy lên Git. |

---

## 🚀 Hướng Dẫn Đẩy Lên GitHub & Bật Web Miễn Phí (GitHub Pages)

### Bước 1: Khởi tạo và Đẩy lên GitHub

Mở PowerShell hoặc Terminal tại thư mục này và chạy lần lượt các lệnh sau:

```bash
# 1. Khởi tạo Git
git init

# 2. Thêm toàn bộ file vào Git
git add .

# 3. Tạo commit đầu tiên
git commit -m "feat: Khoi tao du an TOEIC Vocab Pro voi day du tinh nang va xem them"

# 4. Đổi tên nhánh chính thành main
git branch -M main

# 5. Kết nối với repo GitHub của bạn (thay URL bằng link repo GitHub của bạn)
git remote add origin https://github.com/TÊN_GITHUB_CỦA_BẠN/TÊN_REPO.git

# 6. Đẩy code lên GitHub
git push -u origin main
```

---

### Bước 2: Bật GitHub Pages để có Web HTTPS chạy vĩnh viễn cho iOS

Sau khi đẩy code lên GitHub, bạn có thể biến dự án thành một trang Web có **HTTPS** chạy online 24/7 hoàn toàn miễn phí:

1. Trên giao diện GitHub của bạn, vào tab **Settings** (Cài đặt) của repository.
2. Ở menu bên trái, cuộn xuống chọn mục **Pages**.
3. Tại phần **Build and deployment**:
   - **Source**: Chọn `Deploy from a branch`.
   - **Branch**: Chọn nhánh `main` và thư mục `/ (root)` &rarr; Bấm **Save**.
4. Chờ khoảng 1-2 phút, GitHub sẽ cấp cho bạn một đường link HTTPS có dạng:
   `https://TÊN_GITHUB_CỦA_BẠN.github.io/TÊN_REPO/`

---

### Bước 3: Cài đặt vĩnh viễn lên iPhone / iPad không cần bật máy tính

1. Dùng **Safari** trên iPhone mở đường link GitHub Pages của bạn.
2. Bấm nút **Chia sẻ (Share)** ở dưới cùng của Safari (biểu tượng ô vuông có mũi tên hướng lên).
3. Chọn **"Thêm vào Màn hình chính" (Add to Home Screen)** &rarr; Nhấn **Thêm (Add)**.
4. **Xong!** Ứng dụng đã được cài đặt vĩnh viễn vào bộ nhớ iPhone. Nhờ có giao thức **HTTPS** của GitHub, Service Worker sẽ tự động lưu trữ 100% dữ liệu: lần sau bạn tắt Wi-Fi hay bật chế độ máy bay vẫn mở app lên học bình thường mà không cần máy tính.

---

## 💡 Các Tính Năng Nổi Bật

- **2.372 từ vựng TOEIC chia sẵn**:
  - `Daily Vocab`: 26 ngày (52 buổi) chia theo Phần Nghe (Day 01–10) và Phần Đọc (Day 11–26).
  - `Master Vocab`: 30 chủ điểm công sở trọng tâm trong đề thi.
  - `Từ vựng của tôi`: Bộ từ tự lưu từ bài luyện nghe chép thực tế.
- **Xem thêm chi tiết đa màu sắc**:
  - Họ từ (Tím Violet), Đồng nghĩa (Xanh Emerald), Trái nghĩa (Đỏ Rose), Cụm từ (Xanh Blue), Mẹo thi & bẫy từ loại (Vàng Amber), Part xuất hiện (`LC`, `P5-6`, `P7`).
- **Thêm từ mới & Sửa từ**:
  - Thêm từ tùy ý hoặc sửa bất kỳ từ nào, dữ liệu tự động lưu trên thiết bị (`localStorage`).
- **5 Game ôn luyện**:
  - Trắc nghiệm 4 đáp án (đảo 2 chiều Anh ⇄ Việt), Gõ từ thông minh theo hàng đợi SRS, Nghe chọn từ, Nghe gõ từ (0.6x/1.0x), Ghép thẻ cặp đôi.
- **Phát âm chuẩn**:
  - Tích hợp Text-to-Speech tự nhiên, hỗ trợ phím tắt `Tab` nghe lại trong game và `Space` lật thẻ Flashcard.
