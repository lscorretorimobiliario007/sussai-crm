/**
 * Preflight before deploy — fails hard if auth/DB/env unsafe.
 * Usage: node scripts/rc-preflight.mjs
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const EMAIL = process.env.SMOKE_EMAIL || "admin@topconceicao.com.br";
const SENHA = process.env.SMOKE_SENHA || "Admin@123";

function fail(msg) {
  console.error("PREFLIGHT FAIL:", msg);
  process.exit(1);
}

async function main() {
  if (!process.env.DATABASE_URL) fail("DATABASE_URL ausente");
  if (!process.env.JWT_SECRET?.trim()) {
    if (process.env.NODE_ENV === "production") fail("JWT_SECRET ausente em produção");
    console.warn("PREFLIGHT WARN: JWT_SECRET vazio (ok só em dev)");
  }

  await prisma.$queryRaw`SELECT 1`;
  console.log("OK database");

  const admin = await prisma.usuario.findUnique({ where: { email: EMAIL } });
  if (!admin) fail(`Usuário admin não encontrado: ${EMAIL}`);
  if (!admin.ativo) fail("Admin inativo");
  const ok = await bcrypt.compare(SENHA, admin.senha);
  if (!ok) fail("Senha admin não confere com hash do banco — rode seed");
  console.log("OK admin bcrypt", EMAIL, admin.perfil);

  const empresa = await prisma.empresa.findUnique({ where: { id: admin.empresaId } });
  if (!empresa?.ativo) fail("Empresa do admin inativa");
  console.log("OK empresa", empresa.id);

  console.log("PREFLIGHT OK");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
