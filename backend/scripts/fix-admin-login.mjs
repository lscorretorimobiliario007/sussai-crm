import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const EMAIL = "admin@topconceicao.com.br";
const PASS = "Admin@123";

async function main() {
  console.log("DB ping...");
  await prisma.$queryRaw`SELECT 1 as ok`;
  console.log("DB OK");

  const tables = await prisma.$queryRaw`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name ILIKE '%usuario%'
    ORDER BY table_name
  `;
  console.log("tables:", tables);

  let user = await prisma.usuario.findUnique({ where: { email: EMAIL } });
  console.log(
    "user before:",
    user
      ? {
          id: user.id,
          email: user.email,
          ativo: user.ativo,
          perfil: user.perfil,
          empresaId: user.empresaId,
          hashPrefix: user.senha?.slice(0, 7),
          hashLen: user.senha?.length,
        }
      : null,
  );

  if (user) {
    console.log("bcrypt.compare before:", await bcrypt.compare(PASS, user.senha));
  }

  let empresa = await prisma.empresa.findFirst({
    where: { OR: [{ id: 1 }, { cnpj: "12345678000190" }] },
  });

  if (!empresa) {
    empresa = await prisma.empresa.create({
      data: {
        nome: "Top Conceicao Imoveis",
        cnpj: "12345678000190",
        email: "contato@topconceicao.com.br",
        telefone: "(11) 4000-0000",
        ativo: true,
        siteAtivo: true,
      },
    });
    console.log("empresa created", empresa.id);
  } else {
    empresa = await prisma.empresa.update({
      where: { id: empresa.id },
      data: { ativo: true, siteAtivo: true },
    });
    console.log("empresa ok", empresa.id, "ativo", empresa.ativo);
  }

  const hash = await bcrypt.hash(PASS, 12);
  user = await prisma.usuario.upsert({
    where: { email: EMAIL },
    update: {
      nome: "Administrador",
      senha: hash,
      perfil: "ADMIN",
      empresaId: empresa.id,
      ativo: true,
    },
    create: {
      nome: "Administrador",
      email: EMAIL,
      senha: hash,
      perfil: "ADMIN",
      empresaId: empresa.id,
      ativo: true,
    },
  });

  const verify = await bcrypt.compare(PASS, user.senha);
  console.log("user after reset:", {
    id: user.id,
    email: user.email,
    ativo: user.ativo,
    perfil: user.perfil,
    empresaId: user.empresaId,
  });
  console.log("bcrypt verify after reset:", verify);
  console.log("JWT_SECRET set:", Boolean(process.env.JWT_SECRET));

  if (!verify) {
    process.exitCode = 2;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
