-- CreateTable
CREATE TABLE "property_owners" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT,
    "cnpj" TEXT,
    "rg" TEXT,
    "telefone" TEXT,
    "celular" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "cep" TEXT,
    "rua" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "estado" CHAR(2),
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_owners_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "properties" ADD COLUMN "proprietarioId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "property_owners_empresaId_cpf_key"
ON "property_owners"("empresaId", "cpf");

-- CreateIndex
CREATE UNIQUE INDEX "property_owners_empresaId_cnpj_key"
ON "property_owners"("empresaId", "cnpj");

-- CreateIndex
CREATE INDEX "property_owners_empresaId_ativo_nome_idx"
ON "property_owners"("empresaId", "ativo", "nome");

-- CreateIndex
CREATE INDEX "property_owners_empresaId_cidade_idx"
ON "property_owners"("empresaId", "cidade");

-- CreateIndex
CREATE INDEX "properties_empresaId_proprietarioId_idx"
ON "properties"("empresaId", "proprietarioId");

-- AddForeignKey
ALTER TABLE "property_owners"
ADD CONSTRAINT "property_owners_empresaId_fkey"
FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties"
ADD CONSTRAINT "properties_proprietarioId_fkey"
FOREIGN KEY ("proprietarioId") REFERENCES "property_owners"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
