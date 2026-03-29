#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# KLLAPP Desktop — Setup Script
#
# 1. Clones the kllapp web repo
# 2. Installs dependencies
# 3. Applies desktop patches (PGlite, auth bypass, Liveblocks mock, etc.)
# 4. Generates Drizzle migrations
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
KLLAPP_DIR="$ROOT_DIR/kllapp"

echo "╔═══════════════════════════════════════════╗"
echo "║     KLLAPP Desktop — Setup                ║"
echo "╚═══════════════════════════════════════════╝"

# ---- Step 1: Clone kllapp ----
if [ -d "$KLLAPP_DIR" ]; then
  echo ""
  echo "→ kllapp/ already exists, pulling latest..."
  cd "$KLLAPP_DIR"
  git pull origin main || true
else
  echo ""
  echo "→ Cloning oxynum/kllapp..."
  git clone https://github.com/oxynum/kllapp.git "$KLLAPP_DIR"
fi

# ---- Step 2: Install kllapp dependencies ----
echo ""
echo "→ Installing kllapp dependencies..."
cd "$KLLAPP_DIR"

# Add desktop-specific dependencies
npm install --save @electric-sql/pglite
npm install --legacy-peer-deps

# Remove packages not needed in desktop mode
# (keeping them doesn't break anything, but reduces bundle size)
echo "→ Desktop mode: Liveblocks and NextAuth will be patched out."

# ---- Step 3: Apply patches ----
echo ""
echo "→ Applying desktop patches..."

# Database: PGlite instead of postgres
cp "$ROOT_DIR/patches/db-adapter.ts" "$KLLAPP_DIR/src/lib/db/index.ts"
echo "  ✓ Database adapter → PGlite"

# Auth: bypass NextAuth
cp "$ROOT_DIR/patches/auth-bypass.ts" "$KLLAPP_DIR/src/auth.ts"
echo "  ✓ Auth → single-user bypass"

# Providers: remove Liveblocks
cp "$ROOT_DIR/patches/providers-patch.tsx" "$KLLAPP_DIR/src/components/providers.tsx"
echo "  ✓ Providers → no Liveblocks"

# Room provider: no-op
cp "$ROOT_DIR/patches/room-provider-patch.tsx" "$KLLAPP_DIR/src/components/sheet/room-provider.tsx"
echo "  ✓ Room provider → passthrough"

# S3: local file storage
cp "$ROOT_DIR/patches/s3-local.ts" "$KLLAPP_DIR/src/lib/s3.ts"
echo "  ✓ S3 storage → local files"

# Middleware: no auth checks
cp "$ROOT_DIR/patches/middleware-patch.ts" "$KLLAPP_DIR/src/middleware.ts"
echo "  ✓ Middleware → locale only"

# Next.js config: PGlite external package
cp "$ROOT_DIR/patches/next-config-patch.ts" "$KLLAPP_DIR/next.config.ts"
echo "  ✓ next.config.ts → PGlite external"

# Desktop config module
cp "$ROOT_DIR/patches/desktop-config.ts" "$KLLAPP_DIR/src/lib/desktop-config.ts"
echo "  ✓ Desktop config module"

# Desktop setup page + actions
mkdir -p "$KLLAPP_DIR/src/app/(auth)/desktop-setup"
cp "$ROOT_DIR/patches/desktop-setup-page.tsx" "$KLLAPP_DIR/src/app/(auth)/desktop-setup/page.tsx"
cp "$ROOT_DIR/patches/desktop-setup-actions.ts" "$KLLAPP_DIR/src/app/(auth)/desktop-setup/actions.ts"
echo "  ✓ Desktop setup page (offline/online)"

# Desktop redirect page (for Electron navigation to remote)
mkdir -p "$KLLAPP_DIR/src/app/(auth)/desktop-redirect"
cp "$ROOT_DIR/patches/desktop-redirect-page.tsx" "$KLLAPP_DIR/src/app/(auth)/desktop-redirect/page.tsx"
echo "  ✓ Desktop redirect page"

# Go online button (in dashboard safe zone)
cp "$ROOT_DIR/patches/go-online-button.tsx" "$KLLAPP_DIR/src/components/ui/go-online-button.tsx"
echo "  ✓ Go online button"

# Dashboard layout: add safe zone + go online button
cp "$ROOT_DIR/patches/dashboard-layout-patch.tsx" "$KLLAPP_DIR/src/app/(dashboard)/layout.tsx"
echo "  ✓ Dashboard layout → safe zone + mode switch"

# Dynamic client sheet (SSR-safe wrapper for glide-data-grid)
mkdir -p "$KLLAPP_DIR/src/components/sheet"
cat > "$KLLAPP_DIR/src/components/sheet/dynamic-client-sheet.tsx" << 'DYNAMIC'
"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { ClientSheet as ClientSheetType } from "./client-sheet";

const ClientSheet = dynamic(
  () => import("./client-sheet").then((m) => m.ClientSheet),
  { ssr: false }
);

export function DynamicClientSheet(props: ComponentProps<typeof ClientSheetType>) {
  return <ClientSheet {...props} />;
}
DYNAMIC
echo "  ✓ Dynamic client sheet (SSR-safe)"

# ---- Step 4: Patch Liveblocks imports in data-grid ----
echo ""
echo "→ Patching Liveblocks imports in source files..."

# Replace @liveblocks/react imports with our mock
find "$KLLAPP_DIR/src" -name "*.ts" -o -name "*.tsx" | while read -r file; do
  if grep -q '@liveblocks/react' "$file" 2>/dev/null; then
    # Skip already-patched files
    if ! grep -q 'liveblocks-mock' "$file" 2>/dev/null; then
      sed -i.bak 's|from "@liveblocks/react/suspense"|from "@/lib/liveblocks-mock"|g' "$file"
      sed -i.bak 's|from "@liveblocks/react"|from "@/lib/liveblocks-mock"|g' "$file"
      rm -f "${file}.bak"
      echo "  ✓ Patched: $(basename "$file")"
    fi
  fi
done

# Replace @liveblocks/client imports
find "$KLLAPP_DIR/src" -name "*.ts" -o -name "*.tsx" | while read -r file; do
  if grep -q '@liveblocks/client' "$file" 2>/dev/null; then
    if ! grep -q 'liveblocks-mock' "$file" 2>/dev/null; then
      sed -i.bak 's|from "@liveblocks/client"|from "@/lib/liveblocks-mock"|g' "$file"
      rm -f "${file}.bak"
      echo "  ✓ Patched: $(basename "$file")"
    fi
  fi
done

# Copy the Liveblocks mock into kllapp/src/lib/
cp "$ROOT_DIR/patches/liveblocks-mock.ts" "$KLLAPP_DIR/src/lib/liveblocks-mock.ts"
echo "  ✓ Liveblocks mock installed at src/lib/liveblocks-mock.ts"

# ---- Step 5: Patch dashboard page to use DynamicClientSheet (SSR-safe) ----
echo ""
echo "→ Patching dashboard page for SSR-safe grid..."
sed -i.bak 's|import { ClientSheet } from "@/components/sheet/client-sheet";|import { DynamicClientSheet } from "@/components/sheet/dynamic-client-sheet";|g' "$KLLAPP_DIR/src/app/(dashboard)/page.tsx"
sed -i.bak 's|<ClientSheet|<DynamicClientSheet|g' "$KLLAPP_DIR/src/app/(dashboard)/page.tsx"
sed -i.bak 's|</ClientSheet>|</DynamicClientSheet>|g' "$KLLAPP_DIR/src/app/(dashboard)/page.tsx"
rm -f "$KLLAPP_DIR/src/app/(dashboard)/page.tsx.bak"
echo "  ✓ Dashboard page → DynamicClientSheet (no SSR)"

# ---- Step 5: Create .env for desktop ----
echo ""
echo "→ Creating desktop .env..."
cat > "$KLLAPP_DIR/.env.local" <<'ENV'
NODE_ENV=development
KLLAPP_DESKTOP=true
AUTH_SECRET=desktop-local-secret-not-used
AUTH_URL=http://localhost:3456
# AI features (optional — add your key to enable Corinne)
# ANTHROPIC_API_KEY=sk-ant-...
ENV
echo "  ✓ .env.local created"

# ---- Step 6: Generate Drizzle migrations ----
echo ""
echo "→ Generating Drizzle migrations for PGlite..."
cd "$KLLAPP_DIR"

# Create a drizzle config for PGlite
cat > "$KLLAPP_DIR/drizzle.config.desktop.ts" <<'DRIZZLE'
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/lib/db/schema.ts",
  dialect: "postgresql",
  driver: "pglite",
  dbCredentials: {
    url: "./pgdata-tmp",
  },
});
DRIZZLE

npx drizzle-kit generate --config=drizzle.config.desktop.ts 2>/dev/null || echo "  ⚠ Migration generation skipped (run manually if needed)"

echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║     Setup complete!                       ║"
echo "║                                           ║"
echo "║     Next steps:                           ║"
echo "║     cd .. && npm run dev                  ║"
echo "╚═══════════════════════════════════════════╝"
