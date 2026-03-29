/**
 * Providers patch for KLLAPP Desktop.
 *
 * Replaces `src/components/providers.tsx` in the kllapp source.
 * Removes LiveblocksProvider and SessionProvider (no OAuth needed).
 * Keeps NextIntlClientProvider for i18n support.
 *
 * USAGE: This file is copied over `kllapp/src/components/providers.tsx` by the setup script.
 */

"use client";

import { ReactNode } from "react";
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
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Europe/Paris">
      {children}
    </NextIntlClientProvider>
  );
}
