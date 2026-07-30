-- V1 Imóveis — campos operacionais
ALTER TABLE "Imovel" ADD COLUMN IF NOT EXISTS "aceitaFgts" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Imovel" ADD COLUMN IF NOT EXISTS "aceitaVeiculo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Imovel" ADD COLUMN IF NOT EXISTS "estudaProposta" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Imovel" ADD COLUMN IF NOT EXISTS "matricula" TEXT;
ALTER TABLE "Imovel" ADD COLUMN IF NOT EXISTS "inscricaoMunicipal" TEXT;
ALTER TABLE "Imovel" ADD COLUMN IF NOT EXISTS "habiteSe" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Imovel" ADD COLUMN IF NOT EXISTS "averbacao" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Imovel" ADD COLUMN IF NOT EXISTS "angariadorId" INTEGER;
ALTER TABLE "Imovel" ADD COLUMN IF NOT EXISTS "dataCaptacao" TIMESTAMP(3);
ALTER TABLE "Imovel" ADD COLUMN IF NOT EXISTS "chavesNaImobiliaria" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Imovel" ADD COLUMN IF NOT EXISTS "chaveDigital" TEXT;
ALTER TABLE "Imovel" ADD COLUMN IF NOT EXISTS "seoTitulo" TEXT;
ALTER TABLE "Imovel" ADD COLUMN IF NOT EXISTS "seoDescricao" TEXT;
ALTER TABLE "Imovel" ADD COLUMN IF NOT EXISTS "plantaUrl" TEXT;

CREATE INDEX IF NOT EXISTS "Imovel_empresaId_angariadorId_idx" ON "Imovel"("empresaId", "angariadorId");
CREATE INDEX IF NOT EXISTS "Imovel_empresaId_dataCaptacao_idx" ON "Imovel"("empresaId", "dataCaptacao");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Imovel_angariadorId_fkey'
  ) THEN
    ALTER TABLE "Imovel"
      ADD CONSTRAINT "Imovel_angariadorId_fkey"
      FOREIGN KEY ("angariadorId") REFERENCES "Usuario"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
