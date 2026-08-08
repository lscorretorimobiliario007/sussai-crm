import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "admin@topconceicao.com.br";
const ADMIN_PASSWORD = "Admin@123";

async function main() {
  const senha = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const empresa = await prisma.empresa.upsert({
    where: { cnpj: "12345678000190" },
    update: {
      nome: "Top Conceicao Imoveis",
      email: "contato@topconceicao.com.br",
      telefone: "(11) 4000-0000",
      ativo: true,
      siteAtivo: true,
    },
    create: {
      nome: "Top Conceicao Imoveis",
      cnpj: "12345678000190",
      email: "contato@topconceicao.com.br",
      telefone: "(11) 4000-0000",
      ativo: true,
      siteAtivo: true,
    },
  });

  await prisma.usuario.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      nome: "Administrador",
      senha,
      perfil: "ADMIN",
      empresaId: empresa.id,
      ativo: true,
    },
    create: {
      nome: "Administrador",
      email: ADMIN_EMAIL,
      senha,
      perfil: "ADMIN",
      empresaId: empresa.id,
      ativo: true,
    },
  });

  const staffPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

  await prisma.usuario.upsert({
    where: { email: "gerente@topconceicao.com.br" },
    update: {
      nome: "Gerente Top",
      senha: staffPassword,
      perfil: "GERENTE",
      empresaId: empresa.id,
      ativo: true,
    },
    create: {
      nome: "Gerente Top",
      email: "gerente@topconceicao.com.br",
      senha: staffPassword,
      perfil: "GERENTE",
      empresaId: empresa.id,
      ativo: true,
    },
  });

  await prisma.usuario.upsert({
    where: { email: "corretor@topconceicao.com.br" },
    update: {
      nome: "Corretor Top",
      senha: staffPassword,
      perfil: "CORRETOR",
      empresaId: empresa.id,
      ativo: true,
    },
    create: {
      nome: "Corretor Top",
      email: "corretor@topconceicao.com.br",
      senha: staffPassword,
      perfil: "CORRETOR",
      empresaId: empresa.id,
      ativo: true,
    },
  });

  console.log("Seed executado com sucesso.");
  console.log(`ADMIN: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`GERENTE: gerente@topconceicao.com.br / ${ADMIN_PASSWORD}`);
  console.log(`CORRETOR: corretor@topconceicao.com.br / ${ADMIN_PASSWORD}`);
  console.log(`SITE_EMPRESA_ID should be: ${empresa.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
