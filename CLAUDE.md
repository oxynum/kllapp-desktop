# KLLAPP Desktop — AI Assistant Guide

## Project

KLLAPP Desktop wraps the KLLAPP web app in Electron with two modes:
- **Offline**: PGlite (PostgreSQL WASM) embedded database, no internet needed
- **Online**: loads kllapp.com directly, full auth via Google/magic link

## Quick Setup

```bash
git clone https://github.com/oxynum/kllapp-desktop.git
cd kllapp-desktop
npm install
npm run setup         # Clones kllapp, applies patches
node scripts/init-db.mjs  # Init local PGlite database
npm run dev           # Starts Electron + Next.js dev server
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run setup` | Clone kllapp + apply desktop patches |
| `npm run dev` | Start dev mode (Electron + Next.js) |
| `npm run build:desktop` | Build native installer for current platform |
| `npm run build:electron` | Compile Electron TypeScript only |
| `node scripts/init-db.mjs` | Initialize/reset PGlite database |

## Architecture

### Patches (applied over kllapp source)

| Patch file | Replaces | Purpose |
|-----------|----------|---------|
| `db-adapter.ts` | `src/lib/db/index.ts` | PGlite database |
| `auth-bypass.ts` | `src/auth.ts` | Auto-login, no OAuth |
| `desktop-config.ts` | `src/lib/desktop-config.ts` | Config read/write |
| `desktop-setup-page.tsx` | `src/app/(auth)/desktop-setup/page.tsx` | Mode selection UI |
| `desktop-setup-actions.ts` | `src/app/(auth)/desktop-setup/actions.ts` | Server actions |
| `desktop-redirect-page.tsx` | `src/app/(auth)/desktop-redirect/page.tsx` | Redirect to remote |
| `go-online-button.tsx` | `src/components/ui/go-online-button.tsx` | Mode switch button |
| `dashboard-layout-patch.tsx` | `src/app/(dashboard)/layout.tsx` | Safe zone + Go online |
| `providers-patch.tsx` | `src/components/providers.tsx` | SessionProvider only |
| `room-provider-patch.tsx` | `src/components/sheet/room-provider.tsx` | No-op room |
| `liveblocks-mock.ts` | `src/lib/liveblocks-mock.ts` | Mock Liveblocks hooks |
| `s3-local.ts` | `src/lib/s3.ts` | Local file storage |
| `middleware-patch.ts` | `src/middleware.ts` | Setup redirect + locale |
| `next-config-patch.ts` | `next.config.ts` | PGlite external package |

### Electron main process

- `electron/main.ts` — Window creation, mode detection, CSS injection for remote
- `electron/next-server.ts` — Start Next.js standalone on dynamic port
- `electron/database.ts` — PGlite init + Drizzle migrations
- `electron/preload.ts` — IPC bridge

### Mode switching

- Config stored in `~/Library/Application Support/KLLAPP/config.json`
- **Offline → Online**: "Go online" button in safe zone → `/desktop-setup` → kllapp.com
- **Online → Offline**: "Go offline" button injected by Electron → deletes config → `/desktop-setup`
- First launch with no config → redirected to `/desktop-setup`

## Key conventions

- **Never modify kllapp/ directly** — it's cloned and patched by setup.sh
- **All customizations go in patches/** — one file per concern
- **Electron code in electron/** — TypeScript compiled to dist-electron/
- **PGlite data** persists in OS userData directory

## Gotchas

- PGlite is single-connection only — no concurrent access
- `kllapp/` is gitignored — re-run `npm run setup` after clone
- Online mode injects CSS for safe titlebar area (40px top padding)
- `@glideapps/glide-data-grid` requires `ssr: false` via DynamicClientSheet wrapper
- Dev mode uses port 3456
