import fs from "node:fs/promises";
import path from "node:path";
import { IMOVEL_UPLOAD_ROOT } from "../config/uploads.js";

export function propertyImagePath(empresaId, imovelId, fileName) {
  return path.join(
    IMOVEL_UPLOAD_ROOT,
    String(empresaId),
    String(imovelId),
    path.basename(fileName),
  );
}

export async function hasValidImageSignature(file) {
  const handle = await fs.open(file.path, "r");
  try {
    const buffer = Buffer.alloc(12);
    await handle.read(buffer, 0, buffer.length, 0);
    if (file.mimetype === "image/jpeg") {
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    }
    if (file.mimetype === "image/png") {
      return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    }
    if (file.mimetype === "image/webp") {
      return buffer.subarray(0, 4).toString() === "RIFF"
        && buffer.subarray(8, 12).toString() === "WEBP";
    }
    return false;
  } finally {
    await handle.close();
  }
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
