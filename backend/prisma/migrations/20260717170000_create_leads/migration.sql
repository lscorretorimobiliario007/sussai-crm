-- CreateEnum
CREATE TYPE "LeadOrigem" AS ENUM (
  'SITE',
  'ZAP',
  'VIVA_REAL',
  'IMOVELWEB',
  'OLX',
  'MERCADO_LIVRE',
  'FACEBOOK',
  'INSTAGRAM',
  'GOOGLE',
  'MANUAL',
  'OUTRO'
);

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM (
  'NOVO',
  'PRIMEIRO_CONTATO',
  'VISITA_AGENDADA',
  'PROPOSTA',
  'NEGOCIACAO',
  'FECHADO',
  'PERDIDO'
);

-- CreateTable
CREATE TABLE "leads" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "propertyId" INTEGER,
    "assignedUserId" INTEGER,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "whatsapp" TEXT,
    "origem" "LeadOrigem" NOT NULL DEFAULT 'MANUAL',
    "status" "LeadStatus" NOT NULL DEFAULT 'NOVO',
    "mensagem" TEXT,
    "observacoes" TEXT,
    "ultimoContatoEm" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leads_empresaId_ativo_createdAt_idx" ON "leads"("empresaId", "ativo", "createdAt");
CREATE INDEX "leads_empresaId_status_idx" ON "leads"("empresaId", "status");
CREATE INDEX "leads_empresaId_origem_idx" ON "leads"("empresaId", "origem");
CREATE INDEX "leads_empresaId_assignedUserId_idx" ON "leads"("empresaId", "assignedUserId");
CREATE INDEX "leads_empresaId_propertyId_idx" ON "leads"("empresaId", "propertyId");

-- AddForeignKey
ALTER TABLE "leads"
  ADD CONSTRAINT "leads_empresaId_fkey"
  FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "leads"
  ADD CONSTRAINT "leads_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "properties"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "leads"
  ADD CONSTRAINT "leads_assignedUserId_fkey"
  FOREIGN KEY ("assignedUserId") REFERENCES "Usuario"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
