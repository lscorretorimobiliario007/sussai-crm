export function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function buildImovelSlug({ titulo, codigo, id }) {
  const base = slugify(titulo) || slugify(codigo) || `imovel-${id || "novo"}`;
  const code = slugify(codigo);
  if (code && !base.includes(code)) return `${base}-${code}`.slice(0, 140);
  return base;
}
