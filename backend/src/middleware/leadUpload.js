import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import multer from "multer";
import {
  ALLOWED_DOCUMENT_TYPES,
  LEAD_UPLOAD_ROOT,
  MAX_DOCUMENT_SIZE,
  MAX_LEAD_ATTACHMENTS,
} from "../config/uploads.js";

function leadDir(req) {
  return path.join(
    LEAD_UPLOAD_ROOT,
    String(req.usuario.empresaId),
    String(req.params.id),
  );
}

const storage = multer.diskStorage({
  destination(req, file, callback) {
    const directory = leadDir(req);
    fs.mkdirSync(directory, { recursive: true });
    callback(null, directory);
  },
  filename(req, file, callback) {
    callback(null, `${randomUUID()}${ALLOWED_DOCUMENT_TYPES.get(file.mimetype)}`);
  },
});

export const uploadLeadAnexos = multer({
  storage,
  limits: { files: MAX_LEAD_ATTACHMENTS, fileSize: MAX_DOCUMENT_SIZE },
  fileFilter(req, file, callback) {
    if (!ALLOWED_DOCUMENT_TYPES.has(file.mimetype)) {
      return callback(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
    }
    return callback(null, true);
  },
}).array("anexos", MAX_LEAD_ATTACHMENTS);
