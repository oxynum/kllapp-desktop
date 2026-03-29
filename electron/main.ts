import { app, BrowserWindow, shell } from "electron";
import path from "path";
import { initDatabase, closeDatabase } from "./database";
import { startNextServer } from "./next-server";

// Keep a global reference to avoid garbage collection
let mainWindow: BrowserWindow | null = null;

const isDev = !app.isPackaged;

async function createWindow(port: number) {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "KLLAPP",
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
    backgroundColor: "#ffffff",
  });

  // Show when ready to avoid white flash
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  // Open external links in the system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  await mainWindow.loadURL(`http://localhost:${port}`);

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    // Set app name (affects userData path)
    app.setName("KLLAPP");

    if (!isDev) {
      // Production: initialize PGlite database (in dev, use init-db.mjs separately)
      console.log("[KLLAPP] Initializing database...");
      await initDatabase();
      console.log("[KLLAPP] Database ready.");
    }

    // Start/connect to Next.js server
    console.log("[KLLAPP] Starting Next.js server...");
    const port = await startNextServer();
    console.log(`[KLLAPP] Next.js ready on port ${port}`);

    // Create the main window
    await createWindow(port);
  } catch (error) {
    console.error("[KLLAPP] Fatal startup error:", error);
    app.quit();
  }
});

// macOS: re-create window when dock icon is clicked
app.on("activate", async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    const port = parseInt(process.env.KLLAPP_PORT ?? "3456", 10);
    await createWindow(port);
  }
});

// Quit when all windows are closed (except macOS)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Cleanup on exit
app.on("before-quit", async () => {
  await closeDatabase();
});
