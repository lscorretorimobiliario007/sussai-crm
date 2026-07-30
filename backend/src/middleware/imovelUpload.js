import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import multer from "multer";
import {
  ALLOWED_IMAGE_TYPES,
  IMOVEL_UPLOAD_ROOT,
  MAX_IMAGE_SIZE,
  MAX_PROPERTY_IMAGES,
} from "../config/uploads.js";

const storage = multer.diskStorage({
  destination(req, file, callback) {
    const directory = path.join(
      IMOVEL_UPLOAD_ROOT,
      String(req.usuario.empresaId),
      String(req.imovel.id),
    );
    fs.mkdirSync(directory, { recursive: true });
    callback(null, directory);
  },
  filename(req, file, callback) {
    callback(null, `${randomUUID()}${ALLOWED_IMAGE_TYPES.get(file.mimetype)}`);
  },
});

export const uploadImovelFotos = multer({
  storage,
  limits: {
    files: MAX_PROPERTY_IMAGES,
    fileSize: MAX_IMAGE_SIZE,
  },
  fileFilter(req, file, callback) {
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      return callback(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
    }
    return callback(null, true);
  },
}).array("fotos", MAX_PROPERTY_IMAGES);
