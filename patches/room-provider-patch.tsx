/**
 * Room provider patch for KLLAPP Desktop.
 *
 * Replaces `src/components/sheet/room-provider.tsx` in the kllapp source.
 * No Liveblocks room — just renders children directly.
 *
 * USAGE: This file is copied over `kllapp/src/components/sheet/room-provider.tsx` by the setup script.
 */

"use client";

import { ReactNode } from "react";

export function SheetRoomProvider({
  children,
}: {
  orgId: string;
  year: number;
  children: ReactNode;
}) {
  return <>{children}</>;
}
