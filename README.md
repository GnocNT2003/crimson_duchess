# Crimson Duchess

**English** | [Tiếng Việt](README.vi.md)

A Discord music bot for the **Mấy con chó đỏ** server. Streams and plays YouTube audio in voice channels, with support for downloading and queueing tracks.

---

## Features

- Stream YouTube audio directly to a voice channel
- Download YouTube audio and save it for offline playback
- Queue multiple tracks for sequential playback
- Pause, resume, and stop playback
- Autocomplete suggestions for queued and downloaded tracks

---

## Commands

### Music

| Command | Description |
| --- | --- |
| `/play youtube <url>` | Stream audio from a YouTube URL directly |
| `/play queue <name>` | Play a track from the download queue (with autocomplete) |
| `/play-download <videoname>` | Play a previously downloaded track (with autocomplete) |
| `/download <url>` | Download audio from a YouTube URL to permanent storage |
| `/queue <url>` | Add a YouTube URL to the download queue |
| `/pause` | Pause the currently playing track |
| `/unpause` | Resume a paused track |
| `/stop` | Stop playback and disconnect from the voice channel |

### Utility

| Command | Description |
| --- | --- |
| `/help` | List all available commands |
| `/ping` | Check bot latency |

---

## Running the Bot

The bot is configured to serve a single guild. All configuration is provided through environment variables.

### Prerequisites

- [Node.js](https://nodejs.org/) v24+
- [pnpm](https://pnpm.io/) v9+
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) installed and available on `PATH`
- [ffmpeg](https://ffmpeg.org/) (bundled via `ffmpeg-static`)

### Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```env
DISCORD_TOKEN=            # Bot token from Discord Developer Portal
DISCORD_APP_ID=           # Application (client) ID
DISCORD_PUBLIC_KEY=       # Public key from Discord Developer Portal
GUILD_ID=                 # ID of the "Những con chó đỏ" server
DEFAULT_VOICE_CHANNEL_ID= # ID of the default voice channel to join
PORT=1942                 # HTTP server port (health check)
```

### Infisical

Instead of managing a `.env` file manually, secrets can be injected at runtime using the [Infisical CLI](https://infisical.com/docs/cli/overview) pointed at a self-hosted instance.

#### 1. Install the CLI

```bash
# macOS / Linux
curl -1sLf 'https://dl.cloudsmith.io/public/infisical/infisical-cli/setup.deb.sh' | sudo bash
sudo apt-get install infisical   # Debian/Ubuntu

# Windows (winget)
winget install Infisical.Infisical
```

#### 2. Log in to the self-hosted instance

```bash
infisical login --domain=https://<your-infisical-host>
```

This writes a session token to `~/.infisical/`. The project's `.infisical.json` already contains the workspace ID, so no further project init is needed.

#### 3. Run with injected secrets

The `dev` scripts wrap commands with `infisical run --env=dev --path=/Discord`, which pulls secrets from the `/Discord` path in the `dev` environment and injects them as environment variables:

```bash
pnpm build
pnpm start-all:dev   # Registers slash commands + starts bot, both via Infisical
```

Or run each step separately:

```bash
infisical run --env=dev --path=/Discord -- node dist/registerCommands.js
infisical run --env=dev --path=/Discord -- pnpm start
```

> When using Infisical, a `.env` file is not required. The two approaches are mutually exclusive — use one or the other.

---

### Local Setup (manual `.env`)

```bash
pnpm install
pnpm build
pnpm start-all       # Registers slash commands, then starts the bot
```

### Docker (Production)

```bash
docker compose up -d
```

The compose file reads environment variables from `.env` and mounts two volumes for persistent storage:

- `dowload_music_data` → `/app/download` — permanently saved tracks
- `temp_music_data` → `/app/temp` — temporary files used during streaming

The image installs `yt-dlp` at build time so no external dependency is needed at runtime.
