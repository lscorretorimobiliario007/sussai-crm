export function slugify(value?: string | null): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

export function buildPropertySlug(input: {
  titulo?: string | null;
  codigo?: string | null;
  id?: number | null;
}): string {
  const base =
    slugify(input.titulo) ||
    slugify(input.codigo) ||
    `imovel-${input.id || 'novo'}`;
  const code = slugify(input.codigo);
  if (code && !base.includes(code)) {
    return `${base}-${code}`.slice(0, 140);
  }
  return base.slice(0, 140);
}

export function buildPublicFileUrl(filePath: string): string {
  let normalized = filePath.replace(/\\/g, '/').replace(/^\/+/, '');
  // Evita /uploads/uploads/... quando o path já vem com prefixo
  if (normalized.startsWith('uploads/')) {
    normalized = normalized.slice('uploads/'.length);
  }
  const relative = `/uploads/${normalized}`;
  const base = (process.env.PUBLIC_BASE_URL || '').replace(/\/+$/, '');
  return base ? `${base}${relative}` : relative;
}
