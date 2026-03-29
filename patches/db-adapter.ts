/**
 * Hybrid database adapter for KLLAPP Desktop.
 *
 * This file replaces `src/lib/db/index.ts` in the kllapp source.
 *
 * Two modes:
 *   - POSTGRES_URL set → connects to remote PostgreSQL (online mode)
 *   - POSTGRES_URL absent → uses PGlite embedded database (offline mode)
 *
 * The Drizzle ORM schema and all queries remain 100% unchanged in both modes.
 *
 * USAGE: This file is copied over `kllapp/src/lib/db/index.ts` by the setup script.
 */

import * as schema from "./schema";

type DrizzleDB = ReturnType<typeof import("drizzle-orm/pglite")["drizzle"]>;

const globalForDb = globalThis as unknown as {
  db: DrizzleDB | undefined;
};

function createDb(): DrizzleDB {
  // Mode 1: Remote PostgreSQL (online — same as web version)
  if (process.env.POSTGRES_URL) {
    console.log("[KLLAPP Desktop] Connecting to remote PostgreSQL...");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const postgres = require("postgres");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { drizzle } = require("drizzle-orm/postgres-js");
    const client = postgres(process.env.POSTGRES_URL, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      max_lifetime: 60 * 30,
    });
    return drizzle(client, { schema });
  }

  // Mode 2: Local PGlite (offline)
  console.log("[KLLAPP Desktop] Using local PGlite database...");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PGlite } = require("@electric-sql/pglite");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { drizzle } = require("drizzle-orm/pglite");

  // Check if main process already created the instance
  const existing = (globalThis as Record<string, unknown>).__kllapp_pglite;
  if (existing) return drizzle(existing, { schema });

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const os = require("os");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require("path");
  const defaultDir = process.platform === "darwin"
    ? path.join(os.homedir(), "Library", "Application Support", "KLLAPP", "pgdata")
    : process.platform === "win32"
      ? path.join(process.env.APPDATA ?? os.homedir(), "KLLAPP", "pgdata")
      : path.join(os.homedir(), ".config", "KLLAPP", "pgdata");
  const dataDir = process.env.PGLITE_DATA_DIR ?? defaultDir;
  const client = new PGlite(dataDir);
  return drizzle(client, { schema });
}

export const db = globalForDb.db ?? createDb();
globalForDb.db = db;
