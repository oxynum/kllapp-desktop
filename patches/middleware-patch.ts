/**
 * Middleware patch for kllapp Desktop.
 *
 * - Redirects to /desktop-setup if no config exists
 * - Locale detection (no auth checks — single-user mode)
 *
 * USAGE: This file is copied over `kllapp/src/middleware.ts` by the setup script.
 */

import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

const locales = ["fr", "en"] as const;
type Locale = (typeof locales)[number];
const defaultLocale: Locale = "fr";

export default function middleware(req: NextRequest) {
  const { nextUrl } = req;

  // Skip static assets and API routes
  if (
    nextUrl.pathname.startsWith("/_next") ||
    nextUrl.pathname.startsWith("/api") ||
    nextUrl.pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Check if desktop config exists (skip for setup page itself)
  if (!nextUrl.pathname.startsWith("/desktop-setup")) {
    try {
      const fs = require("fs");
      const path = require("path");
      const os = require("os");
      const configDir = process.platform === "darwin"
        ? path.join(os.homedir(), "Library", "Application Support", "kllapp")
        : process.platform === "win32"
          ? path.join(process.env.APPDATA ?? os.homedir(), "kllapp")
          : path.join(os.homedir(), ".config", "kllapp");
      const configPath = path.join(configDir, "config.json");

      if (!fs.existsSync(configPath)) {
        return NextResponse.redirect(new URL("/desktop-setup", nextUrl));
      }
    } catch {
      // If fs fails, let it through
    }
  }

  // Locale detection: cookie > Accept-Language > default
  let locale: Locale = defaultLocale;

  const cookieLocale = req.cookies.get("NEXT_LOCALE")?.value;
  if (cookieLocale && locales.includes(cookieLocale as Locale)) {
    locale = cookieLocale as Locale;
  } else {
    const acceptLang = req.headers.get("Accept-Language");
    if (acceptLang) {
      const preferred = acceptLang
        .split(",")
        .map((part) => {
          const [lang, q] = part.trim().split(";q=");
          return { lang: lang.trim().split("-")[0], q: q ? parseFloat(q) : 1 };
        })
        .sort((a, b) => b.q - a.q);
      for (const { lang } of preferred) {
        if (locales.includes(lang as Locale)) {
          locale = lang as Locale;
          break;
        }
      }
    }
  }

  const currentCookie = req.cookies.get("NEXT_LOCALE")?.value;
  if (currentCookie !== locale) {
    const response = NextResponse.next();
    response.cookies.set("NEXT_LOCALE", locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      secure: false,
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
