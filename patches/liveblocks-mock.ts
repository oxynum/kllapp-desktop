/**
 * Liveblocks mock for KLLAPP Desktop.
 *
 * In offline single-user mode, there's no real-time collaboration.
 * This module exports mock hooks that return empty/no-op values.
 *
 * The setup script patches imports throughout the codebase to use
 * these mocks instead of the real Liveblocks hooks.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// Mock LiveMap that stores data in a plain Map
export class LiveMap<K = string, V = any> extends Map<K, V> {
  toImmutable() {
    return new Map(this);
  }
}

// Mock hooks — return safe defaults
export function useOthers() {
  return [];
}

export function useUpdateMyPresence() {
  return () => {};
}

export function useSelf() {
  return {
    presence: { name: "Admin", color: "#3B82F6", cursor: null, visibleRegion: null },
    info: { name: "Admin" },
  };
}

export function useMyPresence() {
  return [
    { name: "Admin", color: "#3B82F6", cursor: null, visibleRegion: null },
    () => {},
  ] as const;
}

export function useStorage<T>(selector: (root: any) => T): T {
  // Return empty LiveMap for cells storage
  return selector({ cells: new LiveMap() });
}

export function useMutation<F extends (...args: any[]) => any>(
  callback: (context: any, ...args: Parameters<F>) => ReturnType<F>,
  _deps: unknown[]
) {
  return (...args: Parameters<F>): ReturnType<F> => {
    return callback({ storage: { get: () => new LiveMap() }, self: useSelf(), setMyPresence: () => {} }, ...args);
  };
}

export function useRoom() {
  return { id: "desktop-local" };
}

export function useBroadcastEvent() {
  return () => {};
}

export function useEventListener() {
  return;
}

export function useStatus() {
  return "connected";
}
