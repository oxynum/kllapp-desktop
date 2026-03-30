import { app } from "electron";
import path from "path";
import { ChildProcess, fork } from "child_process";

let serverProcess: ChildProcess | null = null;

/**
 * Start the Next.js standalone server.
 *
 * In production (packaged), we run the standalone server.js.
 * In development, the dev server should already be running via `npm run dev:next`.
 */
export async function startNextServer(): Promise<number> {
  const isDev = !app.isPackaged;

  if (isDev) {
    // In dev mode, the Next.js dev server is started separately via concurrently
    const port = 3456;
    // Wait for the dev server to be ready
    await waitForServer(port);
    process.env.KLLAPP_PORT = String(port);
    return port;
  }

  // Production: use get-port-please to find a free port
  const { getPort } = await import("get-port-please");
  const port = await getPort({ portRange: [3456, 3500] });

  // Path to the standalone Next.js server
  // Next.js standalone is unpacked outside asar (needs real filesystem for chdir)
  const serverPath = path.join(
    app.getAppPath().replace("app.asar", "app.asar.unpacked"),
    "standalone",
    "server.js"
  );

  const dataDir = app.getPath("userData");

  return new Promise((resolve, reject) => {
    serverProcess = fork(serverPath, [], {
      env: {
        ...process.env,
        PORT: String(port),
        HOSTNAME: "localhost",
        NODE_ENV: "production",
        // Desktop-specific env vars
        KLLAPP_DESKTOP: "true",
        KLLAPP_DATA_DIR: dataDir,
        KLLAPP_PORT: String(port),
        // Config dir alignment — same path as Electron main process
        KLLAPP_CONFIG_DIR: process.env.KLLAPP_CONFIG_DIR ?? dataDir,
        // PGlite connection — the DB adapter reads this
        PGLITE_DATA_DIR: path.join(dataDir, "pgdata"),
      },
      stdio: "pipe",
    });

    serverProcess.stdout?.on("data", (data: Buffer) => {
      const msg = data.toString();
      console.log("[Next.js]", msg.trim());
      if (msg.includes("Ready") || msg.includes("started server")) {
        resolve(port);
      }
    });

    serverProcess.stderr?.on("data", (data: Buffer) => {
      console.error("[Next.js]", data.toString().trim());
    });

    serverProcess.on("error", reject);

    serverProcess.on("exit", (code) => {
      if (code !== 0 && code !== null) {
        console.error(`[Next.js] Server exited with code ${code}`);
      }
      serverProcess = null;
    });

    // Fallback: resolve after timeout (first launch can be slow)
    setTimeout(() => resolve(port), 15000);
  });
}

async function waitForServer(port: number, maxAttempts = 50): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`http://localhost:${port}`);
      if (response.ok || response.status === 302) return;
    } catch {
      // Server not ready yet
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Next.js dev server not responding on port ${port} after ${maxAttempts} attempts`);
}

export function stopNextServer() {
  if (serverProcess) {
    serverProcess.kill("SIGTERM");
    serverProcess = null;
  }
}
