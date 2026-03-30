import { app, BrowserWindow, shell, ipcMain } from "electron";
import path from "path";
import fs from "fs";
import os from "os";
import { initDatabase, closeDatabase } from "./database";
import { startNextServer } from "./next-server";

let mainWindow: BrowserWindow | null = null;
let localPort: number = 0;
let serverReady = false;
const isDev = !app.isPackaged;

interface DesktopConfig {
  mode: "local" | "remote";
  serverUrl?: string;
}

/**
 * Config dir: use KLLAPP_CONFIG_DIR env var if set (for Next.js subprocess alignment),
 * otherwise compute from platform.
 */
function getConfigDir(): string {
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

function readConfig(): DesktopConfig | null {
  try {
    const p = getConfigPath();
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return null;
  }
}

function deleteConfig(): void {
  try {
    const p = getConfigPath();
    if (fs.existsSync(p)) fs.unlinkSync(p);
  } catch { /* ignore */ }
}

// Ensure config dir exists (so Next.js subprocess can write config.json)
function ensureConfigDir(): void {
  const dir = getConfigDir();
  fs.mkdirSync(dir, { recursive: true });
}

/**
 * CSS injected into remote pages for macOS safe area + mode switch button.
 */
const REMOTE_CSS = `
  body::before {
    content: '';
    display: block;
    height: 40px;
    width: 100%;
    background: #f9fafb;
    -webkit-app-region: drag;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 99999;
  }
  body {
    padding-top: 40px !important;
  }
  #kllapp-mode-switch {
    position: fixed;
    top: 10px;
    right: 16px;
    z-index: 100000;
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px 4px 6px;
    background: transparent;
    color: #6b7280;
    border: none;
    font-size: 11px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    cursor: pointer;
    transition: color 0.2s;
    -webkit-app-region: no-drag;
    letter-spacing: 0.01em;
  }
  #kllapp-mode-switch:hover {
    color: #111827;
  }
  #kllapp-mode-switch svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }
`;

const REMOTE_JS = `
  (function() {
    if (document.getElementById('kllapp-mode-switch')) return;
    var btn = document.createElement('button');
    btn.id = 'kllapp-mode-switch';
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    var p1 = document.createElementNS(ns, 'path');
    p1.setAttribute('d', 'M21 12a9 9 0 0 0-9-9m0 18a9 9 0 0 0 9-9m-9 9a9 9 0 0 1-9-9m9 9c-2.5 0-4.5-4-4.5-9S9.5 3 12 3m0 18c2.5 0 4.5-4 4.5-9S14.5 3 12 3');
    svg.appendChild(p1);
    var p2 = document.createElementNS(ns, 'line');
    p2.setAttribute('x1', '2');
    p2.setAttribute('y1', '2');
    p2.setAttribute('x2', '22');
    p2.setAttribute('y2', '22');
    p2.setAttribute('stroke', '#ef4444');
    p2.setAttribute('stroke-width', '2.5');
    svg.appendChild(p2);
    btn.appendChild(svg);
    btn.appendChild(document.createTextNode('Go offline'));
    btn.addEventListener('click', function() {
      window.postMessage({ type: 'kllapp-switch-offline' }, '*');
    });
    document.body.appendChild(btn);

    window.addEventListener('message', function(e) {
      if (e.data && e.data.type === 'kllapp-switch-offline') {
        console.log('__kllapp_switch_offline__');
      }
    });
  })();
`;

async function createWindow(url: string, isRemote: boolean = false) {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "kllapp",
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
    backgroundColor: "#f9fafb",
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  // In remote mode, allow ALL navigations (OAuth, redirects, etc.)
  // In local mode, open external links in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url: linkUrl }) => {
    if (isRemote) {
      return { action: "allow" as const };
    }
    try {
      const linkHost = new URL(linkUrl).host;
      if (linkHost === "localhost" || linkHost.includes("127.0.0.1")) {
        return { action: "allow" as const };
      }
    } catch { /* ignore */ }
    shell.openExternal(linkUrl);
    return { action: "deny" as const };
  });

  // On every page load, inject remote UI if we're on a non-localhost page
  mainWindow.webContents.on("did-finish-load", () => {
    const currentUrl = mainWindow?.webContents.getURL() ?? "";
    if (currentUrl && !currentUrl.includes("localhost") && !currentUrl.includes("127.0.0.1")) {
      console.log(`[kllapp] Injecting remote UI on: ${currentUrl.substring(0, 60)}...`);
      injectRemoteUI();
    }
  });

  // Listen for mode switch from injected button (console message bridge)
  mainWindow.webContents.on("console-message", (_e, _level, message) => {
    if (message === "__kllapp_switch_offline__") {
      console.log("[kllapp] Switching to offline mode...");
      deleteConfig();
      if (serverReady && localPort > 0) {
        mainWindow?.loadURL(`http://localhost:${localPort}/desktop-setup`);
      }
    }
  });

  await mainWindow.loadURL(url);

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function injectRemoteUI() {
  if (!mainWindow) return;
  mainWindow.webContents.insertCSS(REMOTE_CSS).catch(() => {});
  mainWindow.webContents.executeJavaScript(REMOTE_JS).catch(() => {});
}

// IPC handler
ipcMain.handle("config:switch-offline", async () => {
  deleteConfig();
  if (serverReady && localPort > 0) {
    mainWindow?.loadURL(`http://localhost:${localPort}/desktop-setup`);
  }
});

app.whenReady().then(async () => {
  try {
    app.setName("kllapp");
    ensureConfigDir();

    // Set KLLAPP_CONFIG_DIR so the Next.js subprocess uses the same path
    process.env.KLLAPP_CONFIG_DIR = getConfigDir();

    // Database init is non-blocking — if it fails (first launch, no local mode yet), continue
    if (!isDev) {
      try {
        console.log("[kllapp] Initializing database...");
        await initDatabase();
        console.log("[kllapp] Database ready.");
      } catch (dbErr) {
        console.warn("[kllapp] Database init skipped (will init on local mode):", dbErr);
      }
    }

    // Start local Next.js server (always needed for setup page + local mode)
    console.log("[kllapp] Starting Next.js server...");
    localPort = await startNextServer();
    serverReady = true;
    console.log(`[kllapp] Next.js ready on port ${localPort}`);

    // Read config to decide what to load
    const config = readConfig();

    if (config?.mode === "remote" && config.serverUrl) {
      // Remote mode: load kllapp.com directly
      console.log(`[kllapp] Remote mode → ${config.serverUrl}`);
      await createWindow(config.serverUrl, true);
    } else if (config?.mode === "local") {
      // Local mode: load the local Next.js dashboard
      console.log("[kllapp] Local mode");
      await createWindow(`http://localhost:${localPort}`);
    } else {
      // No config: show setup screen explicitly (don't rely on middleware redirect)
      console.log("[kllapp] No config found — showing setup screen");
      await createWindow(`http://localhost:${localPort}/desktop-setup`);
    }
  } catch (error) {
    console.error("[kllapp] Fatal startup error:", error);
    app.quit();
  }
});

// macOS: re-create window when dock icon is clicked
app.on("activate", async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    try {
      const config = readConfig();
      if (config?.mode === "remote" && config.serverUrl) {
        await createWindow(config.serverUrl, true);
      } else if (serverReady && localPort > 0) {
        const url = config?.mode === "local"
          ? `http://localhost:${localPort}`
          : `http://localhost:${localPort}/desktop-setup`;
        await createWindow(url);
      } else {
        console.error("[kllapp] Cannot reopen — server not ready");
      }
    } catch (err) {
      console.error("[kllapp] Error reopening window:", err);
    }
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", async () => {
  await closeDatabase();
});
