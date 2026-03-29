/**
 * Database adapter for kllapp Desktop (local mode only).
 *
 * In remote mode, Electron loads kllapp.com directly — this file is not used.
 * In local mode, this uses PGlite (PostgreSQL WASM) as embedded database.
 *
 * USAGE: This file is copied over `kllapp/src/lib/db/index.ts` by the setup script.
 */

import { drizzle } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  pgliteClient: PGlite | undefined;
};

function getClient(): PGlite {
  // Check if Electron main process already created the instance
  const existing = (globalThis as Record<string, unknown>).__kllapp_pglite as PGlite | undefined;
  if (existing) return existing;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const os = require("os");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require("path");
  const defaultDir = process.platform === "darwin"
    ? path.join(os.homedir(), "Library", "Application Support", "kllapp", "pgdata")
    : process.platform === "win32"
      ? path.join(process.env.APPDATA ?? os.homedir(), "kllapp", "pgdata")
      : path.join(os.homedir(), ".config", "kllapp", "pgdata");
  const dataDir = process.env.PGLITE_DATA_DIR ?? defaultDir;
  return new PGlite(dataDir);
}

const client = globalForDb.pgliteClient ?? getClient();
globalForDb.pgliteClient = client;

export const db = drizzle(client, { schema });
