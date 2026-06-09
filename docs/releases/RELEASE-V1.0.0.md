# Release v1.0.0

**Release date:** 2026-06-09

First stable release of Crimson Duchess — a Discord music bot for the **Mấy con chó đỏ** server.

---

## Features

### Music playback

The core feature of the bot. It connects to a voice channel and plays audio sourced from YouTube, using `yt-dlp` to handle downloading and `ffmpeg` for audio processing.

There are two playback modes:

- **Stream** — downloads to a temporary directory and plays immediately. The file is not kept after the session.
- **Persistent download** — saves the audio file to permanent storage (`downloads/musics/`) for repeated playback without re-downloading.

### Queue system

Tracks can be added to an in-memory queue while another track is already playing. Each queue item carries a status (`downloading`, `ready`, `playing`, `error`) so the bot knows exactly what stage it is in. Once a track finishes, the next `ready` item in the queue plays automatically.

### Autocomplete

Both `/play queue` and `/play-download` support Discord's autocomplete. Typing part of a track name surfaces matching suggestions in real time — the filter matches anywhere in the filename, not just the start.

### Voice channel management

The bot auto-joins the guild's configured default voice channel on first playback and maintains the connection. If disconnected, it attempts to reconnect up to three times before giving up.

### Health check endpoint

An Express HTTP server runs alongside the bot and exposes `GET /api/health` for uptime monitoring and container health checks.

---

## Commands

### Music

#### `/play youtube <url>`

Streams audio from a YouTube video URL. The video is downloaded to a temporary directory and played immediately. Only standard YouTube video URLs are accepted (playlists and channel links are rejected).

#### `/play queue <name>`

Plays a track that is already in the in-memory queue. Supports autocomplete — Discord will suggest queue item names as you type. If the bot is already playing something, the currently playing track's status is reset to `ready` and the new track takes over.

#### `/queue <url>`

Adds a YouTube video to the download queue without interrupting the current playback. The audio is downloaded in the background; once it reaches `ready` status it can be played with `/play queue`.

#### `/download <url>`

Downloads audio from a YouTube URL to permanent storage (`downloads/musics/`). The file persists across bot restarts and can be played later with `/play-download`.

#### `/play-download <videoname>`

Plays a previously downloaded track from permanent storage. Supports autocomplete — suggestions are drawn from filenames in the downloads folder. The `.mp3` extension is stripped from suggestions.

#### `/pause`

Pauses the currently playing audio. Responds with a message if nothing is playing or if the player is already paused.

#### `/unpause`

Resumes a paused audio player. Responds with a message if the player is already playing or if there is nothing to resume.

#### `/stop`

Stops playback, destroys the voice connection, and disconnects the bot from the voice channel.

### Utility

#### `/help`

Lists all registered commands with their descriptions, generated dynamically from the loaded command collection.

#### `/ping`

Replies with the current WebSocket latency in milliseconds. Useful for confirming the bot is online and responsive.

---

## Technical notes

- Built with **discord.js v14** and **@discordjs/voice**.
- Audio downloading handled entirely by the **`yt-dlp` CLI** — no Python runtime required in production.
- Multi-stage Docker build: separates dependency installation, TypeScript compilation, and the final runtime image to minimise image size.
- Slash commands are registered on startup via the Discord REST API, scoped to the configured guild (`GUILD_ID`).
- Secrets are managed through **Infisical** in the development workflow; the production Docker container receives them as environment variables directly.
