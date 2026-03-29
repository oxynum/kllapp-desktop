/**
 * Liveblocks mock for KLLAPP Desktop.
 *
 * In offline single-user mode, there's no real-time collaboration.
 * All hooks return safe no-op values.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export class LiveMap<K = string, V = any> extends Map<K, V> {
  toImmutable() {
    return new Map(this);
  }
}

export function useOthers(): any[] {
  return [];
}

export function useUpdateMyPresence(): (patch: any) => void {
  return () => {};
}

export function useSelf(): any {
  return {
    presence: { name: "Admin", color: "#3B82F6", cursor: null, visibleRegion: null },
    info: { name: "Admin" },
  };
}

export function useMyPresence(): any {
  return [
    { name: "Admin", color: "#3B82F6", cursor: null, visibleRegion: null },
    () => {},
  ];
}

export function useStorage(selector: (root: any) => any): any {
  return selector({ cells: new LiveMap() });
}

export function useMutation(callback: any, _deps: any[]): any {
  return (...args: any[]) => {
    return callback({ storage: { get: () => new LiveMap() }, self: useSelf(), setMyPresence: () => {} }, ...args);
  };
}

export function useRoom(): any {
  return { id: "desktop-local" };
}

export function useBroadcastEvent(): any {
  return () => {};
}

export function useEventListener(): void {
  return;
}

export function useStatus(): string {
  return "connected";
}
