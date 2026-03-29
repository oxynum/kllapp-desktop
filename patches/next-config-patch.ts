/**
 * Next.js config patch for KLLAPP Desktop.
 *
 * Replaces `next.config.ts` in the kllapp source.
 * Adds PGlite to serverExternalPackages, removes postgres.
 *
 * USAGE: This file is copied over `kllapp/next.config.ts` by the setup script.
 */

import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["node-ical", "@electric-sql/pglite"],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default withNextIntl(nextConfig);
