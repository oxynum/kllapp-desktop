/**
 * Database adapter patch for KLLAPP Desktop.
 *
 * This file replaces `src/lib/db/index.ts` in the kllapp source.
 * It uses PGlite (PostgreSQL WASM) instead of the postgres TCP driver.
 *
 * The Drizzle ORM schema and all queries remain 100% unchanged —
 * PGlite speaks the same PostgreSQL dialect.
 *
 * USAGE: This file is copied over `kllapp/src/lib/db/index.ts` by the setup script.
 */

import { drizzle } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  pgliteClient: PGlite | undefined;
};

// In Electron, the main process initializes PGlite and stores it on globalThis.
// In standalone server mode, we initialize it here with the data dir from env.
function getClient(): PGlite {
  // Check if main process already created the instance
  const existing = (globalThis as Record<string, unknown>).__kllapp_pglite as PGlite | undefined;
  if (existing) return existing;

  // Standalone server: use env var for data directory
  const dataDir = process.env.PGLITE_DATA_DIR ?? "./pgdata";
  return new PGlite(dataDir);
}

const client = globalForDb.pgliteClient ?? getClient();
globalForDb.pgliteClient = client;

export const db = drizzle(client, { schema });
