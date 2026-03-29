/**
 * Providers patch for kllapp Desktop.
 *
 * Replaces `src/components/providers.tsx` in the kllapp source.
 * Keeps SessionProvider (needed by useSession in sidebar) but removes LiveblocksProvider.
 *
 * USAGE: This file is copied over `kllapp/src/components/providers.tsx` by the setup script.
 */

"use client";

import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";

export function Providers({
  children,
  locale,
  messages,
}: {
  children: ReactNode;
  locale: string;
  messages: AbstractIntlMessages;
}) {
  return (
    <SessionProvider>
      <NextIntlClientProvider locale={locale} messages={messages} timeZone="Europe/Paris">
        {children}
      </NextIntlClientProvider>
    </SessionProvider>
  );
}
