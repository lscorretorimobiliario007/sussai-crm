import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "admin@topconceicao.com.br";
const ADMIN_PASSWORD = "Admin@123";

const DEFAULT_PIPELINE_STAGES = [
  { nome: "Aguardando contato", ordem: 1, cor: "#6366f1" },
  { nome: "Primeiro Contato", ordem: 2, cor: "#8b5cf6" },
  { nome: "Visita Agendada", ordem: 3, cor: "#a855f7" },
  { nome: "Proposta", ordem: 4, cor: "#f59e0b" },
  { nome: "Negociação", ordem: 5, cor: "#f97316" },
  { nome: "Fechado", ordem: 6, cor: "#22c55e" },
  { nome: "Perdido", ordem: 7, cor: "#ef4444" },
];

async function ensurePipelineStages(empresaId) {
  const existing = await prisma.pipelineStage.count({ where: { empresaId } });
  if (existing > 0) {
    await prisma.pipelineStage.updateMany({
      where: {
        empresaId,
        ordem: 1,
        nome: { in: ["Novo", "NOVO", "novo"] },
      },
      data: { nome: "Aguardando contato" },
    });
    return;
  }
  await prisma.pipelineStage.createMany({
    data: DEFAULT_PIPELINE_STAGES.map((stage) => ({
      empresaId,
      nome: stage.nome,
      ordem: stage.ordem,
      cor: stage.cor,
      ativo: true,
    })),
  });
}

async function main() {
  const senha = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const empresa = await prisma.empresa.upsert({
    where: { cnpj: "12345678000190" },
    update: {
      nome: "Top Conceicao Imoveis",
      nomeFantasia: "Top Conceição",
      email: "contato@topconceicao.com.br",
      telefone: "(11) 4000-0000",
      ativo: true,
      siteAtivo: true,
    },
    create: {
      nome: "Top Conceicao Imoveis",
      nomeFantasia: "Top Conceição",
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

  await ensurePipelineStages(empresa.id);

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
