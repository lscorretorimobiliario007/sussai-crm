import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import type { Request } from 'express';

export const PROPERTY_UPLOAD_ROOT = join(process.cwd(), 'uploads', 'properties');
export const MAX_PROPERTY_IMAGE_SIZE = 10 * 1024 * 1024;
export const MAX_PROPERTY_IMAGES = 40;

export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

const MIME_EXTENSION: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export function ensurePropertyUploadDir(propertyId: number | string): string {
  const dir = join(PROPERTY_UPLOAD_ROOT, String(propertyId));
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function resolveImageExtension(originalName: string, mimeType: string): string {
  const fromName = extname(originalName).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp'].includes(fromName)) {
    return fromName === '.jpeg' ? '.jpg' : fromName;
  }
  return MIME_EXTENSION[mimeType] || '.jpg';
}

function paramAsString(value: string | string[] | undefined): string | undefined {
  if (value == null) {
    return undefined;
  }
  return Array.isArray(value) ? value[0] : value;
}

export const propertyImagesMulterOptions = {
  limits: {
    fileSize: MAX_PROPERTY_IMAGE_SIZE,
    files: MAX_PROPERTY_IMAGES,
  },
  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
      return callback(
        new BadRequestException('Apenas imagens JPG, JPEG, PNG e WEBP são permitidas'),
        false,
      );
    }
    return callback(null, true);
  },
  storage: diskStorage({
    destination: (req, _file, callback) => {
      try {
        const propertyId = paramAsString(req.params.propertyId || req.params.id);
        if (!propertyId) {
          return callback(new BadRequestException('Imóvel inválido'), '');
        }
        const dir = ensurePropertyUploadDir(propertyId);
        return callback(null, dir);
      } catch (error) {
        return callback(error as Error, '');
      }
    },
    filename: (_req, file, callback) => {
      const extension = resolveImageExtension(file.originalname, file.mimetype);
      callback(null, `${randomUUID()}${extension}`);
    },
  }),
};
