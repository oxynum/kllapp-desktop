import { app } from "electron";
import path from "path";

let pgliteInstance: unknown = null;

/**
 * Initialize PGlite database.
 *
 * PGlite is PostgreSQL compiled to WASM — it runs the full PostgreSQL engine
 * in a single process with data persisted to a directory on disk.
 *
 * The Drizzle schema from kllapp is 100% compatible — no query changes needed.
 */
export async function initDatabase(): Promise<void> {
  const { PGlite } = await import("@electric-sql/pglite");

  const dataDir = path.join(app.getPath("userData"), "pgdata");
  console.log(`[KLLAPP] PGlite data directory: ${dataDir}`);

  const client = new PGlite(dataDir);

  // Store globally so the patched db adapter can access it
  (globalThis as Record<string, unknown>).__kllapp_pglite = client;
  pgliteInstance = client;

  // Run initial schema setup if needed
  await runMigrations(client);
}

/**
 * Run database migrations on startup.
 *
 * In the desktop version, we use Drizzle's programmatic migrator
 * to apply migrations from the bundled migration files.
 */
async function runMigrations(client: unknown): Promise<void> {
  try {
    const { drizzle } = await import("drizzle-orm/pglite");
    const { migrate } = await import("drizzle-orm/pglite/migrator");

    const db = drizzle(client as ConstructorParameters<typeof import("drizzle-orm/pglite")["drizzle"]>[0]);

    // Migrations are generated from the kllapp schema via drizzle-kit
    const migrationsPath = path.join(
      app.isPackaged
        ? path.join(process.resourcesPath, "app.asar.unpacked")
        : path.join(__dirname, ".."),
      "drizzle"
    );

    await migrate(db, { migrationsFolder: migrationsPath });
    console.log("[KLLAPP] Migrations applied successfully.");
  } catch (error) {
    console.error("[KLLAPP] Migration error:", error);
    throw error;
  }
}

/**
 * Create the default user and organization on first launch.
 * This replaces the OAuth sign-up flow for the desktop version.
 */
export async function seedDesktopUser(): Promise<void> {
  const { drizzle } = await import("drizzle-orm/pglite");
  const db = drizzle((globalThis as Record<string, unknown>).__kllapp_pglite as ConstructorParameters<typeof import("drizzle-orm/pglite")["drizzle"]>[0]);

  // Check if any user exists
  const result = await db.execute<{ count: string }>(
    "SELECT COUNT(*) as count FROM users"
  );
  const count = parseInt(result.rows[0]?.count ?? "0", 10);

  if (count === 0) {
    console.log("[KLLAPP] First launch — creating default user and organization...");

    // Create default organization
    await db.execute(
      `INSERT INTO organizations (id, name, slug)
       VALUES (gen_random_uuid(), 'My Organization', 'my-org')
       ON CONFLICT DO NOTHING`
    );

    // Create default auth user
    await db.execute(
      `INSERT INTO auth_users (id, name, email)
       VALUES (gen_random_uuid(), 'Admin', 'admin@localhost')
       ON CONFLICT DO NOTHING`
    );

    // Create default app user linked to auth user
    const authUsers = await db.execute<{ id: string }>(
      "SELECT id FROM auth_users LIMIT 1"
    );
    const orgs = await db.execute<{ id: string }>(
      "SELECT id FROM organizations LIMIT 1"
    );

    if (authUsers.rows[0] && orgs.rows[0]) {
      await db.execute(
        `INSERT INTO users (id, name, email, auth_user_id, current_organization_id, role, is_super_admin)
         VALUES (gen_random_uuid(), 'Admin', 'admin@localhost', '${authUsers.rows[0].id}', '${orgs.rows[0].id}', 'admin', true)
         ON CONFLICT DO NOTHING`
      );

      const appUsers = await db.execute<{ id: string }>(
        "SELECT id FROM users LIMIT 1"
      );

      if (appUsers.rows[0]) {
        await db.execute(
          `INSERT INTO organization_members (id, user_id, organization_id, role, status, is_owner)
           VALUES (gen_random_uuid(), '${appUsers.rows[0].id}', '${orgs.rows[0].id}', 'admin', 'active', true)
           ON CONFLICT DO NOTHING`
        );
      }
    }

    console.log("[KLLAPP] Default user created: admin@localhost");
  }
}

export async function closeDatabase(): Promise<void> {
  if (pgliteInstance) {
    try {
      await (pgliteInstance as { close(): Promise<void> }).close();
      console.log("[KLLAPP] Database closed.");
    } catch (error) {
      console.error("[KLLAPP] Error closing database:", error);
    }
  }
}
