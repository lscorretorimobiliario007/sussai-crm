/**
 * Resolve JWT signing secret. Production must set JWT_SECRET; no insecure fallback.
 */
export function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'JWT_SECRET é obrigatório em produção. Defina a variável de ambiente antes de iniciar.',
    );
  }

  return 'dev-only-insecure-jwt-secret';
}
