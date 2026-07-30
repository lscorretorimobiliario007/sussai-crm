import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import multer from "multer";
import {
  ALLOWED_DOCUMENT_TYPES,
  ALLOWED_IMAGE_TYPES,
  CLIENTE_UPLOAD_ROOT,
  MAX_CLIENT_DOCUMENTS,
  MAX_DOCUMENT_SIZE,
  MAX_IMAGE_SIZE,
} from "../config/uploads.js";

function clientDir(req, subfolder) {
  return path.join(
    CLIENTE_UPLOAD_ROOT,
    String(req.usuario.empresaId),
    String(req.cliente.id),
    subfolder,
  );
}

const avatarStorage = multer.diskStorage({
  destination(req, file, callback) {
    const directory = clientDir(req, "avatar");
    fs.mkdirSync(directory, { recursive: true });
    callback(null, directory);
  },
  filename(req, file, callback) {
    callback(null, `${randomUUID()}${ALLOWED_IMAGE_TYPES.get(file.mimetype)}`);
  },
});

const documentStorage = multer.diskStorage({
  destination(req, file, callback) {
    const directory = clientDir(req, "documentos");
    fs.mkdirSync(directory, { recursive: true });
    callback(null, directory);
  },
  filename(req, file, callback) {
    callback(null, `${randomUUID()}${ALLOWED_DOCUMENT_TYPES.get(file.mimetype)}`);
  },
});

export const uploadClienteAvatar = multer({
  storage: avatarStorage,
  limits: { files: 1, fileSize: MAX_IMAGE_SIZE },
  fileFilter(req, file, callback) {
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      return callback(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
    }
    return callback(null, true);
  },
}).single("avatar");

export const uploadClienteDocumentos = multer({
  storage: documentStorage,
  limits: { files: MAX_CLIENT_DOCUMENTS, fileSize: MAX_DOCUMENT_SIZE },
  fileFilter(req, file, callback) {
    if (!ALLOWED_DOCUMENT_TYPES.has(file.mimetype)) {
      return callback(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
    }
    return callback(null, true);
  },
}).array("documentos", MAX_CLIENT_DOCUMENTS);
