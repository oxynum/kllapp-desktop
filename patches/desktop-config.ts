/**
 * Desktop configuration module.
 *
 * Reads/writes config.json in the OS user data directory.
 * - mode: "local" → PGlite embedded database
 * - mode: "remote" → Electron loads serverUrl directly (e.g. kllapp.com)
 *
 * USAGE: Copied to kllapp/src/lib/desktop-config.ts by setup script.
 */

import fs from "fs";
import path from "path";
import os from "os";

export interface DesktopConfig {
  mode: "local" | "remote";
  serverUrl?: string;
  configuredAt?: string;
}

function getConfigDir(): string {
  // Use env var from Electron main process (ensures same path in subprocess)
  if (process.env.KLLAPP_CONFIG_DIR) return process.env.KLLAPP_CONFIG_DIR;
  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", "kllapp");
  } else if (process.platform === "win32") {
    return path.join(process.env.APPDATA ?? os.homedir(), "kllapp");
  }
  return path.join(os.homedir(), ".config", "kllapp");
}

function getConfigPath(): string {
  return path.join(getConfigDir(), "config.json");
}

export function getDesktopConfig(): DesktopConfig | null {
  try {
    const configPath = getConfigPath();
    if (!fs.existsSync(configPath)) return null;
    const raw = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(raw) as DesktopConfig;
  } catch {
    return null;
  }
}

export function saveDesktopConfig(config: DesktopConfig): void {
  const configDir = getConfigDir();
  fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2), "utf-8");
}

export function deleteDesktopConfig(): void {
  try {
    const configPath = getConfigPath();
    if (fs.existsSync(configPath)) fs.unlinkSync(configPath);
  } catch { /* ignore */ }
}
