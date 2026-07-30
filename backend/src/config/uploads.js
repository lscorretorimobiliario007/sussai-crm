import path from "node:path";

export const UPLOAD_ROOT = path.resolve(process.env.UPLOAD_DIR || "uploads");
export const IMOVEL_UPLOAD_ROOT = path.join(UPLOAD_ROOT, "imoveis");
export const CLIENTE_UPLOAD_ROOT = path.join(UPLOAD_ROOT, "clientes");
export const LEAD_UPLOAD_ROOT = path.join(UPLOAD_ROOT, "leads");
export const CORRETOR_UPLOAD_ROOT = path.join(UPLOAD_ROOT, "corretores");
export const EMPRESA_UPLOAD_ROOT = path.join(UPLOAD_ROOT, "empresas");
export const MAX_PROPERTY_IMAGES = 20;
export const MAX_CLIENT_DOCUMENTS = 20;
export const MAX_LEAD_ATTACHMENTS = 20;
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);
export const ALLOWED_DOCUMENT_TYPES = new Map([
  ["application/pdf", ".pdf"],
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["application/msword", ".doc"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".docx"],
]);
