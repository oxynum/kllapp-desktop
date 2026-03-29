<p align="center">
  <strong>KLLAPP Desktop</strong><br/>
  Standalone offline version — runs on Windows, Mac, and Linux without a server.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Electron-35-47848F" alt="Electron" />
  <img src="https://img.shields.io/badge/PGlite-PostgreSQL%20WASM-336791" alt="PGlite" />
  <img src="https://img.shields.io/badge/Next.js-16-black" alt="Next.js" />
  <img src="https://img.shields.io/badge/node-%3E%3D20-brightgreen" alt="Node" />
</p>

---

## What is this?

KLLAPP Desktop wraps [KLLAPP](https://github.com/oxynum/kllapp) (the web-based resource planning platform) in an Electron shell with an embedded PostgreSQL database (PGlite). No server, no Docker, no cloud account needed.

**All your data stays on your machine.**

| | Web version | Desktop version |
|---|---|---|
| Database | PostgreSQL server | PGlite (embedded) |
| Auth | Google OAuth + Magic Link | Auto-login (single user) |
| Real-time | Liveblocks collaboration | Single user (no sync) |
| File storage | S3 / MinIO | Local filesystem |
| AI assistant | Anthropic API | Optional (bring your key) |
| Deployment | Docker / Railway / Vercel | Native app installer |

## Quick Start

### Prerequisites

- **Node.js** >= 20
- **Git**

### Setup

```bash
# 1. Clone this repo
git clone https://github.com/oxynum/kllapp-desktop.git
cd kllapp-desktop

# 2. Install dependencies
npm install

# 3. Run setup (clones kllapp, applies patches)
npm run setup

# 4. Start in dev mode
npm run dev
```

### Build for distribution

```bash
# Build native installer for your platform
npm run build:desktop

# Output in release/
# - macOS: KLLAPP-1.0.0.dmg
# - Windows: KLLAPP-Setup-1.0.0.exe
# - Linux: KLLAPP-1.0.0.AppImage
```

## Architecture

```
kllapp-desktop/
├── electron/           # Electron main process
│   ├── main.ts         # App lifecycle, window creation
│   ├── next-server.ts  # Start Next.js standalone server
│   ├── database.ts     # PGlite init + migrations
│   └── preload.ts      # IPC bridge to renderer
├── patches/            # Files that replace kllapp source files
│   ├── db-adapter.ts   # PGlite instead of postgres driver
│   ├── auth-bypass.ts  # Single-user auto-login
│   ├── liveblocks-mock.ts  # No-op Liveblocks hooks
│   ├── providers-patch.tsx # Providers without Liveblocks
│   ├── s3-local.ts     # Local file storage
│   └── middleware-patch.ts # No auth middleware
├── scripts/
│   ├── setup.sh        # Clone kllapp + apply patches
│   └── build-desktop.sh # Build Next.js + Electron
└── kllapp/             # (cloned by setup, gitignored)
```

### How patches work

The `setup.sh` script:
1. Clones `oxynum/kllapp` into `kllapp/`
2. Copies patch files over specific source files
3. Replaces Liveblocks imports with mock module
4. Generates Drizzle migrations for PGlite

This approach keeps the desktop version in sync with the web version — just re-run `npm run setup` to get the latest features.

### Key technology choices

- **PGlite** — PostgreSQL compiled to WebAssembly. Runs the real PostgreSQL engine in a single process, persisting data to a directory. The Drizzle schema is 100% compatible — zero query changes.
- **Electron** — Provides native window, system tray, auto-updates, and file system access. The Next.js standalone server runs inside the Electron process.
- **No port exposed** — The Next.js server binds to a dynamic localhost port that's only accessible to the Electron window.

## Data storage

All data is stored in your OS user data directory:

| OS | Location |
|---|---|
| macOS | `~/Library/Application Support/KLLAPP/` |
| Windows | `%APPDATA%/KLLAPP/` |
| Linux | `~/.config/KLLAPP/` |

- `pgdata/` — PGlite database files
- `files/` — Uploaded files (expenses, receipts)

## AI Assistant (optional)

The AI assistant (Corinne) works in desktop mode if you provide an Anthropic API key:

1. Edit `kllapp/.env.local`
2. Add: `ANTHROPIC_API_KEY=sk-ant-...`
3. Restart the app

## Chromebook

Chromebook doesn't support Electron. Use the web version instead:
- Self-host with Docker: see [oxynum/kllapp](https://github.com/oxynum/kllapp)
- Or use the PWA from any hosted instance

## License

Same as [KLLAPP](https://github.com/oxynum/kllapp/blob/main/LICENSE) — Sustainable Use License.

---

<p align="center">
  Built by <a href="https://oxynum.fr">Oxynum</a>
</p>
