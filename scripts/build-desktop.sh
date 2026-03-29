#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# KLLAPP Desktop — Build Script
#
# Builds the Next.js app + Electron wrapper for distribution.
# Output: release/ directory with platform-specific installers.
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
KLLAPP_DIR="$ROOT_DIR/kllapp"

echo "╔═══════════════════════════════════════════╗"
echo "║     KLLAPP Desktop — Build                ║"
echo "╚═══════════════════════════════════════════╝"

# ---- Step 1: Build Electron main process ----
echo ""
echo "→ Compiling Electron TypeScript..."
cd "$ROOT_DIR"
npx tsc -p tsconfig.electron.json
echo "  ✓ Electron compiled → dist-electron/"

# ---- Step 2: Build Next.js ----
echo ""
echo "→ Building Next.js (standalone)..."
cd "$KLLAPP_DIR"
npx next build
echo "  ✓ Next.js build complete"

# ---- Step 3: Copy static assets into standalone ----
echo ""
echo "→ Copying static assets..."
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
echo "  ✓ Static assets copied"

# ---- Step 4: Copy Drizzle migrations ----
echo ""
echo "→ Copying Drizzle migrations..."
if [ -d "$KLLAPP_DIR/drizzle" ]; then
  cp -r "$KLLAPP_DIR/drizzle" "$ROOT_DIR/drizzle"
  echo "  ✓ Migrations copied"
else
  echo "  ⚠ No drizzle/ directory found — migrations may need to be generated"
fi

# ---- Step 5: Package with electron-builder ----
echo ""
echo "→ Packaging with electron-builder..."
cd "$ROOT_DIR"
npx electron-builder --config electron-builder.yml

echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║     Build complete!                       ║"
echo "║     Installers: release/                  ║"
echo "╚═══════════════════════════════════════════╝"
echo ""
ls -la release/ 2>/dev/null || echo "  (check release/ directory)"
