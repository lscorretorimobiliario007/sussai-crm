-- CreateEnum
CREATE TYPE "OcupacaoImovel" AS ENUM ('DESOCUPADO', 'OCUPADO_PROPRIETARIO', 'OCUPADO_INQUILINO', 'EM_REFORMA');

-- AlterTable
ALTER TABLE "Imovel"
ADD COLUMN "exclusividade" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "aceitaFinanciamento" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "aceitaPermuta" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "ocupacao" "OcupacaoImovel" NOT NULL DEFAULT 'DESOCUPADO',
ADD COLUMN "observacoesInternas" TEXT,
ADD COLUMN "localChaves" TEXT,
ADD COLUMN "codigoChave" TEXT,
ADD COLUMN "chaveRetirada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "chaveRetiradaEm" TIMESTAMP(3),
ADD COLUMN "chaveRetiradaPor" TEXT,
ADD COLUMN "chaveDevolvidaEm" TIMESTAMP(3),
ADD COLUMN "chaveObservacoes" TEXT;

-- CreateIndex
CREATE INDEX "Imovel_empresaId_exclusividade_idx" ON "Imovel"("empresaId", "exclusividade");
CREATE INDEX "Imovel_empresaId_ocupacao_idx" ON "Imovel"("empresaId", "ocupacao");
CREATE INDEX "Imovel_empresaId_chaveRetirada_idx" ON "Imovel"("empresaId", "chaveRetirada");
