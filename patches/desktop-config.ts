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
  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", "KLLAPP");
  } else if (process.platform === "win32") {
    return path.join(process.env.APPDATA ?? os.homedir(), "KLLAPP");
  }
  return path.join(os.homedir(), ".config", "KLLAPP");
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
