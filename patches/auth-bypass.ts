/**
 * Authentication bypass for KLLAPP Desktop.
 *
 * This file replaces `src/auth.ts` in the kllapp source.
 * Desktop mode is single-user — no OAuth, no magic links, no JWT.
 * The user is automatically "logged in" as the local admin.
 *
 * USAGE: This file is copied over `kllapp/src/auth.ts` by the setup script.
 */

import { db } from "@/lib/db";
import { users, organizationMembers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// Minimal session type matching NextAuth's expected shape
interface DesktopSession {
  user: {
    id: string;
    appUserId: string;
    name: string;
    email: string;
    currentOrganizationId: string | null;
    orgRole: string | null;
    isOrgOwner: boolean;
    locale: string;
    isSuperAdmin: boolean;
  };
  expires: string;
}

/**
 * Returns the desktop session — always "authenticated" as the local user.
 * Drop-in replacement for NextAuth's `auth()` function.
 */
export async function auth(): Promise<DesktopSession | null> {
  try {
    const [appUser] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        authUserId: users.authUserId,
        currentOrganizationId: users.currentOrganizationId,
        locale: users.locale,
        isSuperAdmin: users.isSuperAdmin,
      })
      .from(users)
      .limit(1);

    if (!appUser) return null;

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

// No-op exports for NextAuth API compatibility
export const handlers = {
  GET: async () => new Response("Desktop mode", { status: 200 }),
  POST: async () => new Response("Desktop mode", { status: 200 }),
};
export async function signIn() { return; }
export async function signOut() { return; }
