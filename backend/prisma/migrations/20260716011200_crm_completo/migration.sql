-- CreateEnum
CREATE TYPE "PlanoEmpresa" AS ENUM ('STARTER', 'PROFESSIONAL', 'ENTERPRISE');
CREATE TYPE "StatusImovel" AS ENUM ('DISPONIVEL', 'RESERVADO', 'VENDIDO', 'ALUGADO', 'INATIVO');
CREATE TYPE "TipoCliente" AS ENUM ('PROPRIETARIO', 'INQUILINO', 'COMPRADOR', 'LEAD');
CREATE TYPE "StatusLead" AS ENUM ('NOVO', 'CONTATO', 'VISITA_AGENDADA', 'PROPOSTA', 'NEGOCIACAO', 'FECHADO', 'PERDIDO');
CREATE TYPE "TipoContrato" AS ENUM ('ALUGUEL', 'VENDA', 'ADMINISTRACAO');
CREATE TYPE "StatusContrato" AS ENUM ('RASCUNHO', 'ATIVO', 'ENCERRADO', 'CANCELADO');
CREATE TYPE "StatusCobranca" AS ENUM ('PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO');
CREATE TYPE "PrioridadeTarefa" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'URGENTE');
CREATE TYPE "StatusTarefa" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA');

-- AlterEnum TipoUsuario
ALTER TYPE "TipoUsuario" ADD VALUE IF NOT EXISTS 'GERENTE';

-- CreateTable Empresa
CREATE TABLE "Empresa" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "plano" "PlanoEmpresa" NOT NULL DEFAULT 'STARTER',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Empresa_cnpj_key" ON "Empresa"("cnpj");

-- Migrate existing data: create default empresa
INSERT INTO "Empresa" ("nome", "email", "updatedAt")
SELECT 'Imobiliária Padrão', COALESCE((SELECT "email" FROM "Usuario" LIMIT 1), 'admin@imobiliaria.com'), CURRENT_TIMESTAMP;

-- Add empresaId to Usuario
ALTER TABLE "Usuario" ADD COLUMN "empresaId" INTEGER;
ALTER TABLE "Usuario" ADD COLUMN "telefone" TEXT;

UPDATE "Usuario" SET "empresaId" = (SELECT "id" FROM "Empresa" LIMIT 1);

ALTER TABLE "Usuario" ALTER COLUMN "empresaId" SET NOT NULL;
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add empresaId and new columns to Imovel
ALTER TABLE "Imovel" ADD COLUMN "empresaId" INTEGER;
ALTER TABLE "Imovel" ADD COLUMN "corretorId" INTEGER;
ALTER TABLE "Imovel" ADD COLUMN "status" "StatusImovel" NOT NULL DEFAULT 'DISPONIVEL';
ALTER TABLE "Imovel" ADD COLUMN "imagens" TEXT[] DEFAULT ARRAY[]::TEXT[];

UPDATE "Imovel" SET "empresaId" = (SELECT "id" FROM "Empresa" LIMIT 1);

ALTER TABLE "Imovel" ALTER COLUMN "empresaId" SET NOT NULL;

DROP INDEX IF EXISTS "Imovel_codigo_key";
CREATE UNIQUE INDEX "Imovel_empresaId_codigo_key" ON "Imovel"("empresaId", "codigo");

ALTER TABLE "Imovel" ADD CONSTRAINT "Imovel_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Imovel" ADD CONSTRAINT "Imovel_corretorId_fkey" FOREIGN KEY ("corretorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable Cliente
CREATE TABLE "Cliente" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "tipo" "TipoCliente" NOT NULL DEFAULT 'LEAD',
    "nome" TEXT NOT NULL,
    "cpfCnpj" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "whatsapp" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "notas" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable Lead
CREATE TABLE "Lead" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "clienteId" INTEGER,
    "imovelId" INTEGER,
    "corretorId" INTEGER,
    "titulo" TEXT NOT NULL,
    "status" "StatusLead" NOT NULL DEFAULT 'NOVO',
    "valor" DOUBLE PRECISION,
    "origem" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Lead" ADD CONSTRAINT "Lead_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "Imovel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_corretorId_fkey" FOREIGN KEY ("corretorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable Contrato
CREATE TABLE "Contrato" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "imovelId" INTEGER NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "proprietarioId" INTEGER,
    "corretorId" INTEGER,
    "numero" TEXT NOT NULL,
    "tipo" "TipoContrato" NOT NULL,
    "status" "StatusContrato" NOT NULL DEFAULT 'RASCUNHO',
    "valor" DOUBLE PRECISION NOT NULL,
    "comissao" DOUBLE PRECISION,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "diaVencimento" INTEGER,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contrato_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Contrato_empresaId_numero_key" ON "Contrato"("empresaId", "numero");

ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "Imovel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_proprietarioId_fkey" FOREIGN KEY ("proprietarioId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_corretorId_fkey" FOREIGN KEY ("corretorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable Cobranca
CREATE TABLE "Cobranca" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "contratoId" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "pagamento" TIMESTAMP(3),
    "status" "StatusCobranca" NOT NULL DEFAULT 'PENDENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cobranca_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Cobranca" ADD CONSTRAINT "Cobranca_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Cobranca" ADD CONSTRAINT "Cobranca_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable Tarefa
CREATE TABLE "Tarefa" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "leadId" INTEGER,
    "clienteId" INTEGER,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "dataLimite" TIMESTAMP(3),
    "prioridade" "PrioridadeTarefa" NOT NULL DEFAULT 'MEDIA',
    "status" "StatusTarefa" NOT NULL DEFAULT 'PENDENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tarefa_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Tarefa" ADD CONSTRAINT "Tarefa_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Tarefa" ADD CONSTRAINT "Tarefa_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Tarefa" ADD CONSTRAINT "Tarefa_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Tarefa" ADD CONSTRAINT "Tarefa_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
