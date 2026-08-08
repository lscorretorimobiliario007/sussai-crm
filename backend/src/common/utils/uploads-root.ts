import { existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';

export function getUploadsRoot(): string {
  const root = resolve(
    process.env.UPLOAD_DIR || join(process.cwd(), 'uploads'),
  );
  if (!existsSync(root)) mkdirSync(root, { recursive: true });
  return root;
}

export function resolveUploadPath(...parts: string[]): string {
  return join(getUploadsRoot(), ...parts);
}
