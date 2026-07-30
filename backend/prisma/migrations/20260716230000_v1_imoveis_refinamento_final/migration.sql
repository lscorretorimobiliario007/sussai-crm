-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "OrigemCaptacaoImovel" AS ENUM ('INDICACAO', 'PLACA', 'SITE', 'REDES_SOCIAIS', 'CAPTACAO_ATIVA', 'PROPRIETARIO', 'PARCEIRO', 'PORTAIS', 'OUTRO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SituacaoCaptacaoImovel" AS ENUM ('EM_ANALISE', 'DOCUMENTACAO', 'ATIVO', 'NEGOCIACAO', 'SUSPENSO', 'ENCERRADO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "AcaoChaveImovel" AS ENUM ('RETIRADA', 'DEVOLUCAO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AlterEnum
ALTER TYPE "AcaoHistoricoImovel" ADD VALUE IF NOT EXISTS 'PUBLICADO';
ALTER TYPE "AcaoHistoricoImovel" ADD VALUE IF NOT EXISTS 'RETIRADO_SITE';
ALTER TYPE "AcaoHistoricoImovel" ADD VALUE IF NOT EXISTS 'PRECO_ALTERADO';
ALTER TYPE "AcaoHistoricoImovel" ADD VALUE IF NOT EXISTS 'PROPRIETARIO_ALTERADO';
ALTER TYPE "AcaoHistoricoImovel" ADD VALUE IF NOT EXISTS 'CHAVE_RETIRADA';
ALTER TYPE "AcaoHistoricoImovel" ADD VALUE IF NOT EXISTS 'CHAVE_DEVOLVIDA';

-- AlterTable
ALTER TABLE "Imovel" ADD COLUMN IF NOT EXISTS "origemCaptacao" "OrigemCaptacaoImovel";
ALTER TABLE "Imovel" ADD COLUMN IF NOT EXISTS "situacaoCaptacao" "SituacaoCaptacaoImovel";
ALTER TABLE "Imovel" ADD COLUMN IF NOT EXISTS "proximoContatoProprietario" TIMESTAMP(3);
ALTER TABLE "Imovel" ADD COLUMN IF NOT EXISTS "publicacaoComercial" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Imovel" ADD COLUMN IF NOT EXISTS "oculto" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Imovel" ADD COLUMN IF NOT EXISTS "emRevisao" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE IF NOT EXISTS "ImovelChaveHistorico" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "imovelId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "acao" "AcaoChaveImovel" NOT NULL,
    "retiradoPor" TEXT,
    "devolvidoPor" TEXT,
    "observacao" TEXT,
    "ocorridoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImovelChaveHistorico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ImovelChaveHistorico_empresaId_imovelId_ocorridoEm_idx" ON "ImovelChaveHistorico"("empresaId", "imovelId", "ocorridoEm");

-- CreateIndex (may already exist from earlier RC migrations)
CREATE INDEX IF NOT EXISTS "Imovel_empresaId_angariadorId_idx" ON "Imovel"("empresaId", "angariadorId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Imovel_empresaId_publicadoSite_ativo_oculto_emRevisao_idx" ON "Imovel"("empresaId", "publicadoSite", "ativo", "oculto", "emRevisao");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Imovel_empresaId_situacaoCaptacao_idx" ON "Imovel"("empresaId", "situacaoCaptacao");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Imovel_empresaId_proximoContatoProprietario_idx" ON "Imovel"("empresaId", "proximoContatoProprietario");

-- DropIndex (replaced by composite with oculto/emRevisao)
DROP INDEX IF EXISTS "Imovel_empresaId_publicadoSite_ativo_idx";

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "ImovelChaveHistorico" ADD CONSTRAINT "ImovelChaveHistorico_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "ImovelChaveHistorico" ADD CONSTRAINT "ImovelChaveHistorico_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "Imovel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "ImovelChaveHistorico" ADD CONSTRAINT "ImovelChaveHistorico_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
