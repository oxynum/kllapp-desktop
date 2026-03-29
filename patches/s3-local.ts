/**
 * Local file storage patch for kllapp Desktop.
 *
 * Replaces `src/lib/s3.ts` in the kllapp source.
 * Files are stored on disk in the user's data directory instead of S3/MinIO.
 *
 * USAGE: This file is copied over `kllapp/src/lib/s3.ts` by the setup script.
 */

import fs from "fs/promises";
import path from "path";

const dataDir = process.env.KLLAPP_DATA_DIR ?? process.cwd();
const filesDir = path.join(dataDir, "files");

// Ensure the files directory exists
async function ensureDir() {
  await fs.mkdir(filesDir, { recursive: true });
}

// Dummy S3 client export for compatibility
export const s3 = null;

export async function uploadToS3(key: string, body: Buffer, _contentType: string): Promise<string> {
  await ensureDir();

  // Create subdirectories if key contains slashes
  const filePath = path.join(filesDir, key);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, body);

  // Return a local URL that the Next.js API can serve
  return `/api/files/${key}`;
}

export async function getPresignedUrl(key: string, _expiresIn = 3600): Promise<string> {
  // In desktop mode, files are served directly from the local filesystem
  return `/api/files/${key}`;
}

/**
 * Read a file from local storage. Used by the file-serving API route.
 */
export async function readLocalFile(key: string): Promise<Buffer | null> {
  try {
    const filePath = path.join(filesDir, key);
    return await fs.readFile(filePath);
  } catch {
    return null;
  }
}
