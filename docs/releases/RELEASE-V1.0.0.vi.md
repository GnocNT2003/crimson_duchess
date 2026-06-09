# Phát hành v1.0.0

[English](RELEASE-V1.0.0.md) | **Tiếng Việt**

**Ngày phát hành:** 09/06/2026

Phiên bản ổn định đầu tiên của Crimson Duchess — bot nhạc Discord dành cho server **Mấy con chó đỏ**.

---

## Tính năng

### Phát nhạc

Tính năng cốt lõi của bot. Kết nối vào kênh thoại và phát âm thanh lấy từ YouTube, sử dụng `yt-dlp` để xử lý tải xuống và `ffmpeg` để xử lý âm thanh.

Có hai chế độ phát:

- **Phát trực tiếp** — tải xuống vào thư mục tạm và phát ngay lập tức. File không được giữ lại sau phiên làm việc.
- **Tải xuống cố định** — lưu file âm thanh vào bộ nhớ vĩnh viễn (`downloads/musics/`) để phát lại nhiều lần mà không cần tải lại.

### Hàng chờ nhạc

Có thể thêm bài hát vào hàng chờ trong bộ nhớ trong khi một bài khác đang phát. Mỗi mục trong hàng chờ mang một trạng thái (`downloading`, `ready`, `playing`, `error`) để bot biết chính xác giai đoạn xử lý. Khi một bài phát xong, mục `ready` tiếp theo trong hàng chờ sẽ tự động được phát.

### Gợi ý tự động

Cả `/play queue` và `/play-download` đều hỗ trợ tính năng autocomplete của Discord. Gõ một phần tên bài hát sẽ hiện gợi ý phù hợp theo thời gian thực — bộ lọc khớp bất kỳ vị trí nào trong tên file, không chỉ từ đầu.

### Quản lý kênh thoại

Bot tự động vào kênh thoại mặc định đã cấu hình của server khi phát nhạc lần đầu và duy trì kết nối. Nếu bị ngắt kết nối, bot sẽ thử kết nối lại tối đa ba lần trước khi dừng.

### Health check endpoint

Một HTTP server Express chạy song song với bot và cung cấp endpoint `GET /api/health` để theo dõi uptime và kiểm tra trạng thái container.

---

## Lệnh

### Nhạc

#### `/play youtube <url>`

Phát trực tiếp âm thanh từ URL YouTube. Video được tải về thư mục tạm và phát ngay. URL playlist được chấp nhận — chỉ video hiện tại trong URL được trích xuất và phát, không phát toàn bộ playlist. URL channel bị từ chối.

#### `/play queue <name>`

Phát bài hát đã có trong hàng chờ bộ nhớ. Hỗ trợ autocomplete — Discord gợi ý tên mục trong hàng chờ khi bạn gõ. Nếu bot đang phát bài khác, trạng thái bài đó sẽ được đặt lại thành `ready` và bài mới sẽ được phát.

#### `/queue <url>`

Thêm video YouTube vào hàng chờ tải xuống mà không làm gián đoạn bài đang phát. Âm thanh được tải xuống ngầm; khi đạt trạng thái `ready` có thể phát bằng `/play queue`.

#### `/download <url>`

Tải xuống âm thanh từ URL YouTube vào bộ nhớ cố định (`downloads/musics/`). File tồn tại qua các lần khởi động lại bot và có thể phát sau bằng `/play-download`.

#### `/play-download <videoname>`

Phát bài hát đã tải xuống trước đó từ bộ nhớ cố định. Hỗ trợ autocomplete — gợi ý lấy từ tên file trong thư mục downloads. Phần mở rộng `.mp3` được ẩn khỏi gợi ý.

#### `/pause`

Tạm dừng âm thanh đang phát. Phản hồi thông báo nếu không có gì đang phát hoặc nếu player đã tạm dừng rồi.

#### `/unpause`

Tiếp tục phát audio player đang tạm dừng. Phản hồi thông báo nếu player đang phát hoặc không có gì để tiếp tục.

#### `/stop`

Dừng phát nhạc, hủy kết nối thoại và ngắt bot khỏi kênh thoại.

### Tiện ích

#### `/help`

Liệt kê tất cả các lệnh đã đăng ký kèm mô tả, được tạo tự động từ tập lệnh đã nạp.

#### `/ping`

Trả về độ trễ WebSocket hiện tại tính bằng mili giây. Hữu ích để xác nhận bot đang hoạt động và phản hồi.

---

## Ghi chú kỹ thuật

- Xây dựng bằng **discord.js v14** và **@discordjs/voice**.
- Toàn bộ việc tải âm thanh được xử lý bởi **`yt-dlp` CLI** — không cần Python runtime trong production.
- Docker build đa giai đoạn: tách biệt cài đặt dependency, biên dịch TypeScript và image runtime cuối cùng để giảm kích thước image.
- Slash command được đăng ký lúc khởi động qua Discord REST API, giới hạn trong server đã cấu hình (`GUILD_ID`).
- Secret được quản lý qua **Infisical** trong workflow phát triển; container Docker production nhận chúng dưới dạng biến môi trường trực tiếp.
