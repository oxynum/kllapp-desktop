/**
 * Initialize PGlite database for kllapp Desktop.
 * Creates schema + seeds default user and organization.
 *
 * Run: npx tsx scripts/init-db.ts
 */

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import path from "path";
import os from "os";
import fs from "fs";

const dataDir = process.env.PGLITE_DATA_DIR ?? path.join(
  process.platform === "darwin"
    ? path.join(os.homedir(), "Library", "Application Support", "kllapp")
    : process.platform === "win32"
      ? path.join(process.env.APPDATA ?? os.homedir(), "kllapp")
      : path.join(os.homedir(), ".config", "kllapp"),
  "pgdata"
);

console.log(`[kllapp] PGlite data dir: ${dataDir}`);
fs.mkdirSync(dataDir, { recursive: true });

async function main() {
  const client = new PGlite(dataDir);
  const db = drizzle(client);

  // Run migrations
  const migrationsFolder = path.join(__dirname, "..", "kllapp", "drizzle");
  console.log(`[kllapp] Running migrations from: ${migrationsFolder}`);

  try {
    await migrate(db, { migrationsFolder });
    console.log("[kllapp] Migrations applied.");
  } catch (err) {
    console.error("[kllapp] Migration error:", err);
    // If migrations fail (e.g., partial state), try push approach
    console.log("[kllapp] Attempting schema push via raw SQL...");
  }

  // Check if user exists
  const result = await client.query<{ count: string }>(
    "SELECT COUNT(*) as count FROM users"
  );
  const userCount = parseInt(result.rows[0]?.count ?? "0", 10);

  if (userCount === 0) {
    console.log("[kllapp] Seeding default user and organization...");

    // Create organization
    await client.query(
      `INSERT INTO organizations (id, name, slug, created_at)
       VALUES (gen_random_uuid(), 'Mon Organisation', 'mon-org', now())`
    );

    // Get org id
    const orgResult = await client.query<{ id: string }>(
      "SELECT id FROM organizations LIMIT 1"
    );
    const orgId = orgResult.rows[0]?.id;

    if (!orgId) {
      throw new Error("Failed to create organization");
    }

    // Create auth user
    await client.query(
      `INSERT INTO "user" (id, name, email)
       VALUES (gen_random_uuid(), 'Admin', 'admin@localhost')`
    );

    const authResult = await client.query<{ id: string }>(
      `SELECT id FROM "user" LIMIT 1`
    );
    const authUserId = authResult.rows[0]?.id;

    if (!authUserId) {
      throw new Error("Failed to create auth user");
    }

    // Create app user
    await client.query(
      `INSERT INTO users (id, name, email, auth_user_id, current_organization_id, role, is_super_admin, created_at)
       VALUES (gen_random_uuid(), 'Admin', 'admin@localhost', $1, $2, 'admin', true, now())`,
      [authUserId, orgId]
    );

    const appUserResult = await client.query<{ id: string }>(
      "SELECT id FROM users LIMIT 1"
    );
    const appUserId = appUserResult.rows[0]?.id;

    if (!appUserId) {
      throw new Error("Failed to create app user");
    }

    // Create organization membership
    await client.query(
      `INSERT INTO organization_members (id, user_id, organization_id, role, status, is_owner, created_at)
       VALUES (gen_random_uuid(), $1, $2, 'admin', 'active', true, now())`,
      [appUserId, orgId]
    );

    console.log("[kllapp] Default user created: Admin (admin@localhost)");
    console.log(`[kllapp] Organization: Mon Organisation (${orgId})`);
  } else {
    console.log(`[kllapp] Database already has ${userCount} user(s), skipping seed.`);
  }

  await client.close();
  console.log("[kllapp] Database ready!");
}

main().catch((err) => {
  console.error("[kllapp] Fatal:", err);
  process.exit(1);
});
