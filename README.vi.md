# Crimson Duchess

[English](README.md) | **Tiếng Việt**

Bot nhạc Discord dành cho server **Mấy con chó đỏ**. Phát trực tiếp và phát lại âm thanh YouTube trong các kênh thoại, hỗ trợ tải xuống và xếp hàng chờ bài hát.

---

## Tính năng

- Phát trực tiếp âm thanh YouTube vào kênh thoại
- Tải xuống âm thanh YouTube và lưu lại để phát offline
- Xếp hàng chờ nhiều bài hát và phát theo thứ tự
- Tạm dừng, tiếp tục và dừng phát nhạc
- Gợi ý tự động cho bài hát trong hàng chờ và bài đã tải

---

## Lệnh

### Nhạc

| Lệnh | Mô tả |
| --- | --- |
| `/play youtube <url>` | Phát trực tiếp âm thanh từ URL YouTube |
| `/play queue <name>` | Phát bài hát từ hàng chờ (có gợi ý tự động) |
| `/play-download <videoname>` | Phát bài hát đã tải xuống trước đó (có gợi ý tự động) |
| `/download <url>` | Tải xuống âm thanh từ URL YouTube vào bộ nhớ cố định |
| `/queue <url>` | Thêm URL YouTube vào hàng chờ tải xuống |
| `/pause` | Tạm dừng bài hát đang phát |
| `/unpause` | Tiếp tục phát bài hát đang tạm dừng |
| `/stop` | Dừng phát nhạc và ngắt kết nối khỏi kênh thoại |

### Tiện ích

| Lệnh | Mô tả |
| --- | --- |
| `/help` | Liệt kê tất cả các lệnh hiện có |
| `/ping` | Kiểm tra độ trễ của bot |

---

## Chạy bot

Bot được cấu hình để phục vụ một server duy nhất. Toàn bộ cấu hình được truyền qua biến môi trường.

### Yêu cầu

- [Node.js](https://nodejs.org/) v24+
- [pnpm](https://pnpm.io/) v9+
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) đã cài đặt và có trong `PATH`
- [ffmpeg](https://ffmpeg.org/) (được đóng gói sẵn qua `ffmpeg-static`)

### Biến môi trường

Sao chép `.env.example` thành `.env` và điền các giá trị:

```env
DISCORD_TOKEN=            # Token bot từ Discord Developer Portal
DISCORD_APP_ID=           # Application (client) ID
DISCORD_PUBLIC_KEY=       # Public key từ Discord Developer Portal
GUILD_ID=                 # ID của server "Mấy con chó đỏ"
DEFAULT_VOICE_CHANNEL_ID= # ID kênh thoại mặc định bot sẽ vào
PORT=1942                 # Cổng HTTP server (health check)
```

### Infisical

Thay vì quản lý file `.env` thủ công, các secret có thể được inject lúc chạy bằng [Infisical CLI](https://infisical.com/docs/cli/overview) trỏ đến instance tự host.

#### 1. Cài đặt CLI

```bash
# macOS / Linux
curl -1sLf 'https://dl.cloudsmith.io/public/infisical/infisical-cli/setup.deb.sh' | sudo bash
sudo apt-get install infisical   # Debian/Ubuntu

# Windows (winget)
winget install Infisical.Infisical
```

#### 2. Đăng nhập vào instance tự host

```bash
infisical login --domain=https://<your-infisical-host>
```

Lệnh này ghi session token vào `~/.infisical/`. File `.infisical.json` trong project đã chứa workspace ID nên không cần thêm bước khởi tạo nào khác.

#### 3. Chạy với secret được inject

Các script `dev` bọc lệnh với `infisical run --env=dev --path=/Discord`, kéo secret từ path `/Discord` trong môi trường `dev` và inject vào biến môi trường:

```bash
pnpm build
pnpm start-all:dev   # Đăng ký slash command + khởi động bot, đều qua Infisical
```

Hoặc chạy từng bước riêng lẻ:

```bash
infisical run --env=dev --path=/Discord -- node dist/registerCommands.js
infisical run --env=dev --path=/Discord -- pnpm start
```

> Khi dùng Infisical, không cần file `.env`. Hai cách này loại trừ nhau — chỉ dùng một trong hai.

---

### Chạy local (`.env` thủ công)

```bash
pnpm install
pnpm build
pnpm start-all       # Đăng ký slash command, sau đó khởi động bot
```

### Docker (Production)

```bash
docker compose up -d
```

File compose đọc biến môi trường từ `.env` và mount hai volume để lưu trữ dữ liệu:

- `dowload_music_data` → `/app/download` — các bài hát đã tải xuống vĩnh viễn
- `temp_music_data` → `/app/temp` — file tạm trong quá trình phát trực tiếp

Image đã cài `yt-dlp` lúc build nên không cần cài thêm dependency nào khi chạy.
