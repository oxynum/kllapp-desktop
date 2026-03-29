/**
 * Initialize PGlite database for KLLAPP Desktop.
 * Creates schema + seeds default user and organization.
 *
 * Run: node scripts/init-db.mjs
 */

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import path from "path";
import os from "os";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dataDir = process.env.PGLITE_DATA_DIR ?? path.join(
  process.platform === "darwin"
    ? path.join(os.homedir(), "Library", "Application Support", "KLLAPP")
    : process.platform === "win32"
      ? path.join(process.env.APPDATA ?? os.homedir(), "KLLAPP")
      : path.join(os.homedir(), ".config", "KLLAPP"),
  "pgdata"
);

console.log(`[KLLAPP] PGlite data dir: ${dataDir}`);
fs.mkdirSync(dataDir, { recursive: true });

const client = new PGlite(dataDir);
const db = drizzle(client);

// Run migrations
const migrationsFolder = path.join(__dirname, "..", "kllapp", "drizzle");
console.log(`[KLLAPP] Migrations from: ${migrationsFolder}`);

await migrate(db, { migrationsFolder });
console.log("[KLLAPP] Migrations applied.");

// Check if user exists
const result = await client.query("SELECT COUNT(*) as count FROM users");
const userCount = parseInt(result.rows[0]?.count ?? "0", 10);

if (userCount === 0) {
  console.log("[KLLAPP] Seeding default user and organization...");

  // Create organization
  await client.query(
    `INSERT INTO organizations (id, name, slug, created_at)
     VALUES (gen_random_uuid(), 'Mon Organisation', 'mon-org', now())`
  );

  const orgResult = await client.query("SELECT id FROM organizations LIMIT 1");
  const orgId = orgResult.rows[0]?.id;

  // Create auth user (NextAuth table "user")
  await client.query(
    `INSERT INTO "user" (id, name, email)
     VALUES (gen_random_uuid(), 'Admin', 'admin@localhost')`
  );

  const authResult = await client.query(`SELECT id FROM "user" LIMIT 1`);
  const authUserId = authResult.rows[0]?.id;

  // Create app user
  await client.query(
    `INSERT INTO users (id, name, email, auth_user_id, current_organization_id, role, is_super_admin, created_at)
     VALUES (gen_random_uuid(), 'Admin', 'admin@localhost', $1, $2, 'admin', true, now())`,
    [authUserId, orgId]
  );

  const appUserResult = await client.query("SELECT id FROM users LIMIT 1");
  const appUserId = appUserResult.rows[0]?.id;

  // Create membership
  await client.query(
    `INSERT INTO organization_members (id, user_id, organization_id, email, role, status, is_owner, invited_at)
     VALUES (gen_random_uuid(), $1, $2, 'admin@localhost', 'admin', 'active', true, now())`,
    [appUserId, orgId]
  );

  console.log("[KLLAPP] Default user: Admin (admin@localhost)");
  console.log(`[KLLAPP] Organization: Mon Organisation (${orgId})`);
} else {
  console.log(`[KLLAPP] Database already has ${userCount} user(s), skipping seed.`);
}

await client.close();
console.log("[KLLAPP] Database ready!");
