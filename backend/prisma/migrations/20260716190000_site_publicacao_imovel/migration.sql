-- AlterTable
ALTER TABLE "Imovel"
ADD COLUMN "publicadoSite" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "destaqueSite" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "lancamento" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "altoPadrao" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "slug" TEXT,
ADD COLUMN "tourVirtualUrl" TEXT,
ADD COLUMN "videoUrl" TEXT,
ADD COLUMN "latitude" DOUBLE PRECISION,
ADD COLUMN "longitude" DOUBLE PRECISION;

-- Backfill slugs from codigo (unique per empresa)
UPDATE "Imovel"
SET "slug" = lower(regexp_replace("codigo", '[^a-zA-Z0-9]+', '-', 'g'))
WHERE "slug" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Imovel_empresaId_slug_key" ON "Imovel"("empresaId", "slug");
CREATE INDEX "Imovel_empresaId_publicadoSite_ativo_idx" ON "Imovel"("empresaId", "publicadoSite", "ativo");
CREATE INDEX "Imovel_empresaId_destaqueSite_idx" ON "Imovel"("empresaId", "destaqueSite");
