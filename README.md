<p align="center">
  <strong>KLLAPP Desktop</strong><br/>
  Standalone desktop app — works offline or connected to your KLLAPP server.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Electron-35-47848F" alt="Electron" />
  <img src="https://img.shields.io/badge/PGlite-PostgreSQL%20WASM-336791" alt="PGlite" />
  <img src="https://img.shields.io/badge/Next.js-16-black" alt="Next.js" />
  <img src="https://img.shields.io/badge/node-%3E%3D20-brightgreen" alt="Node" />
</p>

<p align="center">
  <img src="resources/kllapp-desktop-preview.png" alt="KLLAPP Desktop" width="900" />
</p>

---

## What is this?

KLLAPP Desktop wraps [KLLAPP](https://github.com/oxynum/kllapp) (the web-based resource planning platform) in an Electron shell. It works in two modes:

- **Offline mode** — Embedded PGlite database (PostgreSQL WASM). No server, no Docker, no cloud account. All data stays on your machine.
- **Remote mode** — Connects to your existing KLLAPP PostgreSQL database. Access your organization's data from a native desktop app.

| | Web version | Desktop (offline) | Desktop (remote) |
|---|---|---|---|
| Database | PostgreSQL server | PGlite (embedded) | Your PostgreSQL server |
| Auth | Google OAuth + Magic Link | Auto-login | Auto-login (your account) |
| Real-time | Liveblocks collaboration | Single user | Single user |
| File storage | S3 / MinIO | Local filesystem | S3 / MinIO |
| AI assistant | Anthropic API | Optional | Optional |

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

### Connect to your remote KLLAPP server

To use the desktop app with your existing KLLAPP data:

1. Edit `kllapp/.env.local`
2. Add your database connection:
   ```env
   POSTGRES_URL=postgresql://user:password@your-server:5432/kllapp
   KLLAPP_USER_EMAIL=you@example.com
   ```
3. Restart the app

The app connects directly to your PostgreSQL database — same data as the web version.

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
│   ├── db-adapter.ts   # Hybrid: PGlite or remote PostgreSQL
│   ├── auth-bypass.ts  # Auto-login (local or by email)
│   ├── liveblocks-mock.ts  # No-op Liveblocks hooks
│   ├── providers-patch.tsx # Providers without Liveblocks
│   ├── s3-local.ts     # Local file storage (offline mode)
│   └── middleware-patch.ts # Locale-only middleware
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

Re-run `npm run setup` to pull the latest features from the web version.

### Hybrid database adapter

The `db-adapter.ts` patch automatically selects the right driver:

```
POSTGRES_URL set?
  ├── YES → drizzle-orm/postgres-js (remote PostgreSQL)
  └── NO  → drizzle-orm/pglite (local embedded database)
```

Same Drizzle schema, same queries — zero code changes between modes.

## Data storage (offline mode)

| OS | Location |
|---|---|
| macOS | `~/Library/Application Support/KLLAPP/` |
| Windows | `%APPDATA%/KLLAPP/` |
| Linux | `~/.config/KLLAPP/` |

- `pgdata/` — PGlite database files
- `files/` — Uploaded files (expenses, receipts)

## AI Assistant (optional)

The AI assistant (Corinne) works in both modes if you provide an Anthropic API key:

1. Edit `kllapp/.env.local`
2. Add: `ANTHROPIC_API_KEY=sk-ant-...`
3. Restart the app

## License

Same as [KLLAPP](https://github.com/oxynum/kllapp/blob/main/LICENSE) — Sustainable Use License.

---

<p align="center">
  Built by <a href="https://oxynum.fr">Oxynum</a>
</p>
