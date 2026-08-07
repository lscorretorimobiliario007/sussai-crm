import { BadRequestException } from '@nestjs/common';
import type { Request } from 'express';

export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

export const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  ...ALLOWED_IMAGE_MIME_TYPES,
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
]);

const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.heic',
  '.heif',
]);
const DOCUMENT_EXTENSIONS = new Set([
  ...IMAGE_EXTENSIONS,
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.txt',
  '.csv',
]);

type FileFilterCallback = (error: Error | null, acceptFile: boolean) => void;

function extensionOf(filename: string): string {
  const idx = filename.lastIndexOf('.');
  return idx >= 0 ? filename.slice(idx).toLowerCase() : '';
}

export function imageFileFilter(
  _req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback,
) {
  const ext = extensionOf(file.originalname);
  if (
    !ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype) ||
    !IMAGE_EXTENSIONS.has(ext)
  ) {
    return callback(
      new BadRequestException(
        'Apenas imagens JPG, JPEG, PNG e WEBP são permitidas',
      ),
      false,
    );
  }
  return callback(null, true);
}

export function documentFileFilter(
  _req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback,
) {
  const ext = extensionOf(file.originalname);
  if (
    !ALLOWED_DOCUMENT_MIME_TYPES.has(file.mimetype) ||
    !DOCUMENT_EXTENSIONS.has(ext)
  ) {
    return callback(
      new BadRequestException(
        'Tipo de arquivo não permitido. Use PDF, Office, CSV, TXT ou imagens.',
      ),
      false,
    );
  }
  return callback(null, true);
}
