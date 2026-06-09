# Contribution Guide

---

## Development environment setup

### Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| Node.js | 24+ | Match the version in the Dockerfile |
| pnpm | 9+ | Enforced — `npm install` will be blocked |
| yt-dlp | latest | Must be on `PATH` |
| Infisical CLI | latest | Required only for the Infisical-based workflow |

`npm` and `yarn` are blocked by the `preinstall` script. Always use `pnpm`.

### 1. Clone and install

```bash
git clone <repo-url>
cd crimson_duchess
pnpm install
```

### 2. Configure secrets

**Option A — `.env` file**

```bash
cp .env.example .env
# Fill in all values in .env
```

**Option B — Infisical CLI**

Log in to the self-hosted instance once:

```bash
infisical login --domain=https://<your-infisical-host>
```

The workspace is already wired up via `.infisical.json`. Secrets are injected automatically by the `dev` scripts at the `/Discord` path in the `dev` environment.

### 3. Build and run

```bash
pnpm build            # Compile TypeScript → dist/

# With .env:
pnpm start-all        # Register slash commands, then start the bot

# With Infisical:
pnpm start-all:dev    # Same, but secrets are injected by Infisical CLI
```

Slash command registration (`pnpm register`) hits the Discord REST API and needs to succeed at least once before any commands are usable in Discord. Re-run it whenever a command is added, removed, or renamed.

---

## Project structure

```
crimson_duchess/
├── src/
│   ├── index.ts              # Entry point — loads dotenv, calls startBot()
│   ├── bot.ts                # Creates Discord client, attaches events and commands
│   ├── config.ts             # Single source of truth for all env vars
│   ├── server.ts             # Express HTTP server setup
│   ├── registerCommands.ts   # Registers slash commands via Discord REST API
│   │
│   ├── commands/             # One subfolder per category
│   │   ├── music/
│   │   ├── utils/
│   │   ├── law/              # Disabled — kept for reference
│   │   └── gacha/            # Disabled — kept for reference
│   │
│   ├── events/               # Discord gateway event handlers
│   │   ├── ready.ts
│   │   └── interaction.ts
│   │
│   ├── tools/                # Shared modules used across commands
│   │   ├── commandHandler.ts
│   │   ├── filePathResolver.ts
│   │   ├── logging.ts
│   │   ├── queueHandler.ts
│   │   ├── voiceHandler.ts
│   │   └── youtubeHandler.ts
│   │
│   ├── types/                # TypeScript interfaces and enums
│   │   ├── commandTypes.ts
│   │   ├── queueTypes.ts
│   │   └── youtubeUrlTypes.ts
│   │
│   ├── routes/               # Express route handlers
│   │   └── health.ts
│   │
│   └── test/                 # Debug utilities (not a test suite)
│
├── dist/                     # Compiled output — do not edit
├── downloads/
│   ├── musics/               # Permanently saved audio files
│   └── laws/                 # (unused) Law document downloads
├── temp/                     # Temporary files used during streaming
├── docs/
│   ├── releases/
│   └── contribution/
├── .infisical.json           # Infisical workspace binding
├── Dockerfile
├── docker-compose.yml
└── docker-compose.dev.yml
```

### Key modules

**`config.ts`** — All environment variables are read here and nowhere else. Import `config` from this file instead of accessing `process.env` directly in other modules.

**`bot.ts`** — Bootstraps the Discord client. Extends the `Client` type to carry two extra properties available everywhere a `client` is accessible:
- `client.commands` — `Collection<string, Command>` loaded at startup
- `client.queue` — `QueueItem[]`, the in-memory music queue

**`tools/commandHandler.ts`** — Auto-discovers commands at runtime by reading the `dist/commands/` directory recursively. Adding a new `.ts` file in the right folder is enough for it to be picked up — no manual registration required.

**`tools/voiceHandler.ts`** — Owns all voice connection and audio player lifecycle: joining channels, reconnect attempts on disconnect, auto-advancing the queue when a track finishes idle.

**`tools/queueHandler.ts`** — Manages `QueueItem[]` on the client. Downloads audio via `youtubeHandler` and pushes items with `Ready` status onto the queue. Skips re-download if the URL is already present.

**`tools/filePathResolver.ts`** — Centralises all directory and file path logic. Use the exported helpers (`getMusicDownloadsDir`, `getTempDownloadDir`, etc.) instead of constructing paths manually in commands.

**`tools/logging.ts`** — Creates per-module loggers. Each log line includes the module name and an ISO timestamp.

---

## Conventions

### TypeScript

- **Strict mode** is enabled. No implicit `any`, no unchecked nulls.
- **`verbatimModuleSyntax`** is on — type-only imports must use `import type`.
- Target is **ES2022**, module system is **NodeNext**. Use `.js` extensions in imports (the compiled output is plain ESM).
- Unused variables are an error. Prefix intentionally-unused parameters with `_` to suppress.

### Naming

- Source files: **camelCase** (e.g. `queueHandler.ts`, `voiceHandler.ts`).
- Commands: one file per command, named after the command (e.g. `play.ts`, `download.ts`).
- Variables and functions: camelCase. Types and interfaces: PascalCase. Enums and their members: PascalCase.

### Imports

Type-only imports must use `import type`:

```ts
// correct
import type { Guild } from 'discord.js';
import { SlashCommandBuilder } from 'discord.js';

// wrong — will fail lint
import { Guild } from 'discord.js';
```

### Logging

Use `createLogger` from `tools/logging.ts` at the top of each module. Do not call `console.log` directly in commands or tools.

```ts
const logger = createLogger('my-module');
logger.log('Something happened');
logger.sep(); // prints a separator line, use at the start of a command handler
```

### Error handling in commands

Commands should always `deferReply()` for operations that may take time. On error, `editReply` with a user-facing message and log the technical detail with the module logger. Error replies visible only to the invoking user use `MessageFlags.Ephemeral`.

---

## Adding a new command

1. Create `src/commands/<category>/<commandName>.ts`. Use an existing category folder or add a new one.

2. Export a default object that satisfies the `Command` interface:

```ts
import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type Command from '../../types/commandTypes.js';
import { createLogger } from '../../tools/logging.js';

const logger = createLogger('my-command');

const myCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('my-command')
        .setDescription('Does something useful'),

    async execute(interaction: ChatInputCommandInteraction) {
        logger.sep();
        logger.log('START MY-COMMAND');
        await interaction.deferReply();
        // ...
        await interaction.editReply('Done.');
    },
};

export default myCommand;
```

3. If the command needs autocomplete, add an optional `autocomplete` handler to the same object:

```ts
async autocomplete(interaction: AutocompleteInteraction) {
    const focused = interaction.options.getFocused();
    const choices = ['foo', 'bar'].filter(c => c.includes(focused));
    await interaction.respond(choices.map(c => ({ name: c, value: c })));
},
```

4. Build and run. The command handler auto-discovers the file — no import or registration step needed in existing code. Re-register slash commands so Discord picks up the new command definition:

```bash
pnpm build
pnpm register        # or pnpm register:dev for Infisical
```

---

## Linting

```bash
pnpm lint            # Report issues
pnpm lint:fix        # Auto-fix what ESLint can
pnpm check:types     # Type-check without emitting output
```

ESLint uses `typescript-eslint` with `recommendedTypeChecked`, which requires a valid `tsconfig.json`. Both `eslint.config.mjs` and `tsconfig.json` are at the project root.

---

## Docker

For production builds, the `Dockerfile` uses three stages:

1. **`deps`** — installs production dependencies only.
2. **`build`** — installs all dependencies, compiles TypeScript.
3. **Final** — copies `node_modules` from `deps` and `dist/` from `build`, installs `yt-dlp` binary. Nothing from the build toolchain ends up in the final image.

The `docker-compose.dev.yml` spins up a MongoDB instance for local development (currently unused by the bot itself but available for future use).

```bash
# Build and start the production container
docker compose up -d --build
```

Secrets are passed as environment variables via the `environment:` block in `docker-compose.yml` — either from a `.env` file or injected by your deployment pipeline.
