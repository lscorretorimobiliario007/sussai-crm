-- Drop old English property schema if present
DROP TABLE IF EXISTS "properties" CASCADE;

DROP TYPE IF EXISTS "PropertyPurpose";
DROP TYPE IF EXISTS "PropertyType";
DROP TYPE IF EXISTS "PropertyStatus";

-- CreateEnum
CREATE TYPE "FinalidadeImovel" AS ENUM ('VENDA', 'LOCACAO');

-- CreateEnum
CREATE TYPE "TipoImovel" AS ENUM ('CASA', 'APARTAMENTO', 'TERRENO', 'COMERCIAL');

-- CreateTable
CREATE TABLE "properties" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "finalidade" "FinalidadeImovel" NOT NULL,
    "tipo" "TipoImovel" NOT NULL,
    "valorVenda" DOUBLE PRECISION,
    "valorLocacao" DOUBLE PRECISION,
    "endereco" TEXT NOT NULL,
    "numero" TEXT,
    "bairro" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" CHAR(2) NOT NULL,
    "cep" TEXT,
    "quartos" INTEGER NOT NULL DEFAULT 0,
    "banheiros" INTEGER NOT NULL DEFAULT 0,
    "suites" INTEGER NOT NULL DEFAULT 0,
    "vagas" INTEGER NOT NULL DEFAULT 0,
    "areaTerreno" DOUBLE PRECISION,
    "areaConstruida" DOUBLE PRECISION,
    "destaque" BOOLEAN NOT NULL DEFAULT false,
    "publicado" BOOLEAN NOT NULL DEFAULT true,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "empresaId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "properties_empresaId_codigo_key" ON "properties"("empresaId", "codigo");
CREATE INDEX "properties_empresaId_ativo_idx" ON "properties"("empresaId", "ativo");
CREATE INDEX "properties_empresaId_cidade_idx" ON "properties"("empresaId", "cidade");
CREATE INDEX "properties_empresaId_bairro_idx" ON "properties"("empresaId", "bairro");
CREATE INDEX "properties_empresaId_tipo_idx" ON "properties"("empresaId", "tipo");
CREATE INDEX "properties_empresaId_finalidade_idx" ON "properties"("empresaId", "finalidade");
CREATE INDEX "properties_empresaId_publicado_ativo_idx" ON "properties"("empresaId", "publicado", "ativo");

-- AddForeignKey
ALTER TABLE "properties"
  ADD CONSTRAINT "properties_empresaId_fkey"
  FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
