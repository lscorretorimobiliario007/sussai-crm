import fs from "node:fs/promises";
import path from "node:path";
import { CLIENTE_UPLOAD_ROOT } from "../config/uploads.js";

export function clientFilePath(empresaId, clienteId, subfolder, fileName) {
  return path.join(
    CLIENTE_UPLOAD_ROOT,
    String(empresaId),
    String(clienteId),
    subfolder,
    path.basename(fileName),
  );
}

export async function removeFiles(filePaths) {
  await Promise.all(filePaths.filter(Boolean).map(async (filePath) => {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }));
}
