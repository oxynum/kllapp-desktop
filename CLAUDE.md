# KLLAPP Desktop — AI Assistant Guide

## Project

KLLAPP Desktop is the standalone offline version of KLLAPP, wrapping the Next.js web app in Electron with PGlite (PostgreSQL WASM) as the embedded database.

## Quick Setup

```bash
git clone https://github.com/oxynum/kllapp-desktop.git
cd kllapp-desktop
npm install
npm run setup    # Clones kllapp, applies patches
npm run dev      # Starts Electron + Next.js dev server
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run setup` | Clone kllapp repo + apply desktop patches |
| `npm run dev` | Start dev mode (Electron + Next.js) |
| `npm run build:desktop` | Build native installer for current platform |
| `npm run build:electron` | Compile Electron TypeScript only |
| `npm run build:next` | Build Next.js standalone only |

## Architecture

The desktop version applies patches over the web version source:

| Patch file | Replaces | Purpose |
|-----------|----------|---------|
| `patches/db-adapter.ts` | `src/lib/db/index.ts` | PGlite instead of postgres |
| `patches/auth-bypass.ts` | `src/auth.ts` | Auto-login, no OAuth |
| `patches/providers-patch.tsx` | `src/components/providers.tsx` | No Liveblocks |
| `patches/room-provider-patch.tsx` | `src/components/sheet/room-provider.tsx` | No-op room |
| `patches/s3-local.ts` | `src/lib/s3.ts` | Local file storage |
| `patches/middleware-patch.ts` | `src/middleware.ts` | No auth checks |
| `patches/next-config-patch.ts` | `next.config.ts` | PGlite external package |
| `patches/liveblocks-mock.ts` | Installed at `src/lib/liveblocks-mock.ts` | Mock hooks |

## Key conventions

- **Never modify kllapp/ directly** — it's cloned and patched by setup.sh
- **All customizations go in patches/** — one file per concern
- **Electron code in electron/** — TypeScript compiled to dist-electron/
- **PGlite data** persists in OS userData directory (not in project)

## Gotchas

- PGlite is single-connection only — no concurrent access
- The `kllapp/` directory is gitignored — re-run `npm run setup` after clone
- Electron requires `asarUnpack` for PGlite WASM files
- Dev mode uses port 3456 (configurable)
