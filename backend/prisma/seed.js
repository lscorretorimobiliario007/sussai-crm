import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const senha = await bcrypt.hash("123456", 10);

  const empresa = await prisma.empresa.create({
    data: {
      nome: "Top Conceição Imóveis",
      cnpj: "12345678000190",
      email: "contato@topconceicao.com.br",
      telefone: "(11) 4000-0000",
    },
  });

  await prisma.usuario.create({
    data: {
      nome: "Administrador",
      email: "admin@topconceicao.com.br",
      senha,
      perfil: "ADMIN",
      empresaId: empresa.id,
      ativo: true,
    },
  });

  console.log("Seed executado com sucesso.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });