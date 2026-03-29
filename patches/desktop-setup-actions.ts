/**
 * Server actions for the desktop setup page.
 *
 * USAGE: Copied to kllapp/src/app/(auth)/desktop-setup/actions.ts by setup script.
 */

"use server";

import { saveDesktopConfig } from "@/lib/desktop-config";
import { redirect } from "next/navigation";

export async function setupLocalMode(): Promise<void> {
  saveDesktopConfig({
    mode: "local",
    configuredAt: new Date().toISOString(),
  });
  redirect("/");
}

export async function setupRemoteMode(): Promise<void> {
  saveDesktopConfig({
    mode: "remote",
    serverUrl: "https://kllapp.com",
    configuredAt: new Date().toISOString(),
  });
  // Redirect to a page that Electron intercepts to navigate to kllapp.com
  redirect("/desktop-redirect?url=" + encodeURIComponent("https://kllapp.com"));
}

export async function resetConfig(): Promise<void> {
  const { deleteDesktopConfig } = await import("@/lib/desktop-config");
  deleteDesktopConfig();
  redirect("/desktop-setup");
}
