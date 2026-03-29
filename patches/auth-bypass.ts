/**
 * Authentication bypass for KLLAPP Desktop.
 *
 * Two modes:
 *   - KLLAPP_USER_EMAIL set → find that user in the database (remote mode)
 *   - KLLAPP_USER_EMAIL absent → use first user in database (local mode)
 *
 * USAGE: This file is copied over `kllapp/src/auth.ts` by the setup script.
 */

import { db } from "@/lib/db";
import { users, organizationMembers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

interface DesktopSession {
  user: {
    id: string;
    appUserId: string;
    name: string;
    email: string;
    image?: string | null;
    currentOrganizationId: string | null;
    orgRole: string | null;
    isOrgOwner: boolean;
    locale: string;
    isSuperAdmin: boolean;
  };
  expires: string;
}

/**
 * Returns the desktop session.
 * In remote mode, finds user by KLLAPP_USER_EMAIL.
 * In local mode, returns the first user.
 */
export async function auth(): Promise<DesktopSession | null> {
  try {
    const userEmail = process.env.KLLAPP_USER_EMAIL;

    const query = db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        authUserId: users.authUserId,
        currentOrganizationId: users.currentOrganizationId,
        locale: users.locale,
        isSuperAdmin: users.isSuperAdmin,
      })
      .from(users);

    // In remote mode, find the specific user by email
    const [appUser] = userEmail
      ? await query.where(eq(users.email, userEmail)).limit(1)
      : await query.limit(1);

    if (!appUser) {
      console.error("[KLLAPP Desktop] No user found" + (userEmail ? ` for email: ${userEmail}` : ""));
      return null;
    }

    let orgRole: string | null = null;
    let isOrgOwner = false;

    if (appUser.currentOrganizationId) {
      const [membership] = await db
        .select({
          role: organizationMembers.role,
          isOwner: organizationMembers.isOwner,
        })
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.userId, appUser.id),
            eq(organizationMembers.organizationId, appUser.currentOrganizationId)
          )
        );
      orgRole = membership?.role ?? null;
      isOrgOwner = membership?.isOwner ?? false;
    }

    return {
      user: {
        id: appUser.authUserId ?? appUser.id,
        appUserId: appUser.id,
        name: appUser.name ?? "Admin",
        email: appUser.email ?? "admin@localhost",
        currentOrganizationId: appUser.currentOrganizationId,
        orgRole,
        isOrgOwner,
        locale: appUser.locale ?? "fr",
        isSuperAdmin: appUser.isSuperAdmin ?? true,
      },
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    };
  } catch (error) {
    console.error("[KLLAPP Desktop] Auth error:", error);
    return null;
  }
}

// API handlers — SessionProvider fetches GET /api/auth/session
export const handlers = {
  GET: async (req: Request) => {
    const url = new URL(req.url);
    if (url.pathname.endsWith("/session")) {
      const session = await auth();
      return new Response(JSON.stringify(session ?? {}), {
        headers: { "Content-Type": "application/json" },
      });
    }
    if (url.pathname.endsWith("/csrf")) {
      return new Response(JSON.stringify({ csrfToken: "desktop-local" }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    if (url.pathname.endsWith("/providers")) {
      return new Response(JSON.stringify({}), {
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response("Desktop mode", { status: 200 });
  },
  POST: async () => new Response("Desktop mode", { status: 200 }),
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function signIn(..._args: unknown[]) { return; }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function signOut(..._args: unknown[]) { return; }
