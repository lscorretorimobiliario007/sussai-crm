import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const PIPELINE_STAGES = [
  { nome: "Novo", ordem: 1, cor: "#6366f1" },
  { nome: "Primeiro contato", ordem: 2, cor: "#0ea5e9" },
  { nome: "Visita agendada", ordem: 3, cor: "#14b8a6" },
  { nome: "Proposta", ordem: 4, cor: "#f59e0b" },
  { nome: "Negociação", ordem: 5, cor: "#f97316" },
  { nome: "Fechado", ordem: 6, cor: "#22c55e" },
  { nome: "Perdido", ordem: 7, cor: "#ef4444" },
];

async function main() {
  // Password: Admin@123 (legacy seeds used "123456")
  const senha = await bcrypt.hash("Admin@123", 10);

  const empresa = await prisma.empresa.upsert({
    where: { cnpj: "12345678000190" },
    update: {
      nome: "Top Conceição Imóveis",
      nomeFantasia: "Top Conceição",
      email: "contato@topconceicao.com.br",
      telefone: "(11) 4000-0000",
      whatsapp: "(11) 99999-0000",
      plano: "PROFESSIONAL",
      ativo: true,
    },
    create: {
      nome: "Top Conceição Imóveis",
      nomeFantasia: "Top Conceição",
      razaoSocial: "Top Conceição Imóveis LTDA",
      cnpj: "12345678000190",
      email: "contato@topconceicao.com.br",
      telefone: "(11) 4000-0000",
      whatsapp: "(11) 99999-0000",
      cidade: "São Paulo",
      estado: "SP",
      plano: "PROFESSIONAL",
      ativo: true,
    },
  });

  const admin = await prisma.usuario.upsert({
    where: { email: "admin@topconceicao.com.br" },
    update: {
      nome: "Administrador",
      senha,
      perfil: "ADMIN",
      ativo: true,
      statusCorretor: "ATIVO",
      empresaId: empresa.id,
    },
    create: {
      nome: "Administrador",
      email: "admin@topconceicao.com.br",
      senha,
      perfil: "ADMIN",
      empresaId: empresa.id,
      ativo: true,
      statusCorretor: "ATIVO",
      comissaoPadrao: 5,
    },
  });

  for (const stage of PIPELINE_STAGES) {
    const existing = await prisma.pipelineStage.findFirst({
      where: { empresaId: empresa.id, ordem: stage.ordem },
    });
    if (existing) {
      await prisma.pipelineStage.update({
        where: { id: existing.id },
        data: { nome: stage.nome, cor: stage.cor, ativo: true },
      });
    } else {
      await prisma.pipelineStage.create({
        data: {
          empresaId: empresa.id,
          nome: stage.nome,
          ordem: stage.ordem,
          cor: stage.cor,
          ativo: true,
        },
      });
    }
  }

  const owner = await prisma.propertyOwner.upsert({
    where: {
      empresaId_cpf: { empresaId: empresa.id, cpf: "12345678901" },
    },
    update: { nome: "João Proprietário", ativo: true },
    create: {
      empresaId: empresa.id,
      nome: "João Proprietário",
      cpf: "12345678901",
      telefone: "(11) 98888-1111",
      email: "joao.prop@example.com",
      cidade: "São Paulo",
      estado: "SP",
      ativo: true,
    },
  });

  const existingProperty = await prisma.property.findFirst({
    where: { empresaId: empresa.id, codigo: "IMO-001" },
  });

  if (!existingProperty) {
    await prisma.property.create({
      data: {
        empresaId: empresa.id,
        proprietarioId: owner.id,
        codigo: "IMO-001",
        titulo: "Apartamento Centro",
        descricao: "Apartamento de exemplo para seed",
        finalidade: "VENDA",
        tipo: "APARTAMENTO",
        valorVenda: 450000,
        endereco: "Rua Exemplo",
        numero: "100",
        bairro: "Centro",
        cidade: "São Paulo",
        estado: "SP",
        cep: "01000-000",
        quartos: 2,
        banheiros: 1,
        suites: 0,
        vagas: 1,
        publicado: true,
        ativo: true,
        slug: "apartamento-centro",
      },
    });
  }

  const existingCliente = await prisma.cliente.findFirst({
    where: { empresaId: empresa.id, email: "cliente@example.com" },
  });

  if (!existingCliente) {
    await prisma.cliente.create({
      data: {
        empresaId: empresa.id,
        corretorId: admin.id,
        tipo: "COMPRADOR",
        tipoPessoa: "PF",
        status: "PROSPECTO",
        nome: "Maria Cliente",
        email: "cliente@example.com",
        telefone: "(11) 97777-2222",
        whatsapp: "(11) 97777-2222",
        cidade: "São Paulo",
        estado: "SP",
        interesses: ["COMPRA"],
        tags: ["seed"],
        ativo: true,
      },
    });
  }

  const categorias = [
    { nome: "Comissões", tipo: "RECEITA", codigo: "REC-COM" },
    { nome: "Despesas operacionais", tipo: "DESPESA", codigo: "DES-OP" },
  ];

  for (const cat of categorias) {
    const existing = await prisma.categoriaFinanceira.findFirst({
      where: { empresaId: empresa.id, codigo: cat.codigo },
    });
    if (!existing) {
      await prisma.categoriaFinanceira.create({
        data: { empresaId: empresa.id, ...cat, ativo: true },
      });
    }
  }

  console.log("Seed executado com sucesso.");
  console.log("Admin: admin@topconceicao.com.br / Admin@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
