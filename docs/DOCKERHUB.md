# Crimson Duchess

Discord music bot — streams and plays YouTube audio in voice channels for a single guild.

## What's inside

- **Node.js 24 (slim)** runtime
- **`yt-dlp`** binary installed at build time — no Python, no extra dependencies at runtime
- **`ffmpeg-static`** bundled as an npm package for audio processing
- Compiled TypeScript output only — no source files or dev toolchain in the final image

## Tags

| Tag | Description |
| --- | --- |
| `1.0.0` | First stable release |
| `latest` | Tracks the most recent stable build |

## Quick start

```bash
docker run -d \
  --name crimson-duchess \
  -e DISCORD_TOKEN=your_token \
  -e DISCORD_APP_ID=your_app_id \
  -e DISCORD_PUBLIC_KEY=your_public_key \
  -e GUILD_ID=your_guild_id \
  -e DEFAULT_VOICE_CHANNEL_ID=your_channel_id \
  -e PORT=1942 \
  -p 1942:1942 \
  -v crimson_duchess_music:/app/downloads \
  -v crimson_duchess_temp:/app/temp \
  crimson-duchess:1.0.0
```

## Using Docker Compose

```yaml
services:
  crimson-duchess:
    image: crimson-duchess:1.0.0
    container_name: crimson-duchess
    restart: unless-stopped
    ports:
      - ${PORT}:${PORT}
    volumes:
      - music_data:/app/downloads
      - temp_data:/app/temp
    environment:
      DISCORD_TOKEN: ${DISCORD_TOKEN}
      DISCORD_APP_ID: ${DISCORD_APP_ID}
      DISCORD_PUBLIC_KEY: ${DISCORD_PUBLIC_KEY}
      GUILD_ID: ${GUILD_ID}
      DEFAULT_VOICE_CHANNEL_ID: ${DEFAULT_VOICE_CHANNEL_ID}
      PORT: ${PORT}

volumes:
  music_data:
  temp_data:
```

Put the values in a `.env` file next to your `docker-compose.yml` and run:

```bash
docker compose up -d
```

## Environment variables

All variables are required unless a default is noted.

| Variable | Description | Default |
| --- | --- | --- |
| `DISCORD_TOKEN` | Bot token from the Discord Developer Portal | — |
| `DISCORD_APP_ID` | Application (client) ID | — |
| `DISCORD_PUBLIC_KEY` | Public key from the Discord Developer Portal | — |
| `GUILD_ID` | ID of the guild (server) the bot serves | — |
| `DEFAULT_VOICE_CHANNEL_ID` | Voice channel the bot joins on first playback | — |
| `PORT` | Port exposed by the health check HTTP server | `3000` |

## Volumes

| Mount path | Purpose |
| --- | --- |
| `/app/downloads` | Permanently saved audio files downloaded via `/download` |
| `/app/temp` | Temporary files created during `/play youtube` streaming, safe to clear between restarts |

Mount `/app/downloads` on a persistent volume so downloaded tracks survive container restarts and upgrades.

## Ports

| Port | Protocol | Description |
| --- | --- | --- |
| `PORT` | TCP | HTTP server with a `GET /api/health` endpoint for uptime checks |

## Startup behaviour

The container entrypoint runs `pnpm start-all`, which:

1. Registers all slash commands with the Discord REST API (scoped to `GUILD_ID`).
2. Starts the bot process.

This means slash commands are always up to date on every container start. The registration step requires a valid `DISCORD_TOKEN` and `DISCORD_APP_ID` — the container will exit if either is missing.

## Health check

```
GET /api/health  →  200 OK
```

Use this endpoint for Docker health checks or uptime monitoring:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:${PORT}/api/health"]
  interval: 30s
  timeout: 5s
  retries: 3
```

## Building locally

```bash
git clone <repo-url>
cd crimson_duchess
docker build -t crimson-duchess:1.0.0 .
```

The build uses three stages — dependency installation, TypeScript compilation, and the final runtime image — so only production artefacts end up in the shipped image.
