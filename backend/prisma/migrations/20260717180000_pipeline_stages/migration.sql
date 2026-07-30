-- AlterTable
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "stageId" INTEGER;

-- CreateTable
CREATE TABLE IF NOT EXISTS "pipeline_stages" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "cor" TEXT NOT NULL DEFAULT '#6366f1',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pipeline_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "lead_histories" (
    "id" SERIAL NOT NULL,
    "leadId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "stageIdAnterior" INTEGER,
    "stageIdNovo" INTEGER NOT NULL,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "pipeline_stages_empresaId_ordem_key" ON "pipeline_stages"("empresaId", "ordem");
CREATE INDEX IF NOT EXISTS "pipeline_stages_empresaId_ativo_ordem_idx" ON "pipeline_stages"("empresaId", "ativo", "ordem");
CREATE INDEX IF NOT EXISTS "leads_empresaId_stageId_idx" ON "leads"("empresaId", "stageId");
CREATE INDEX IF NOT EXISTS "lead_histories_leadId_createdAt_idx" ON "lead_histories"("leadId", "createdAt");
CREATE INDEX IF NOT EXISTS "lead_histories_userId_idx" ON "lead_histories"("userId");

-- AddForeignKey
DO $$
BEGIN
  ALTER TABLE "pipeline_stages" ADD CONSTRAINT "pipeline_stages_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "leads" ADD CONSTRAINT "leads_stageId_fkey"
    FOREIGN KEY ("stageId") REFERENCES "pipeline_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "lead_histories" ADD CONSTRAINT "lead_histories_leadId_fkey"
    FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "lead_histories" ADD CONSTRAINT "lead_histories_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "lead_histories" ADD CONSTRAINT "lead_histories_stageIdAnterior_fkey"
    FOREIGN KEY ("stageIdAnterior") REFERENCES "pipeline_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "lead_histories" ADD CONSTRAINT "lead_histories_stageIdNovo_fkey"
    FOREIGN KEY ("stageIdNovo") REFERENCES "pipeline_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Seed default stages for existing companies
INSERT INTO "pipeline_stages" ("empresaId", "nome", "ordem", "cor", "ativo", "updatedAt")
SELECT e."id", d.nome, d.ordem, d.cor, true, CURRENT_TIMESTAMP
FROM "Empresa" e
CROSS JOIN (
  VALUES
    ('Novo', 1, '#6366f1'),
    ('Primeiro Contato', 2, '#8b5cf6'),
    ('Visita Agendada', 3, '#a855f7'),
    ('Proposta', 4, '#f59e0b'),
    ('Negociação', 5, '#f97316'),
    ('Fechado', 6, '#22c55e'),
    ('Perdido', 7, '#ef4444')
) AS d(nome, ordem, cor)
WHERE NOT EXISTS (
  SELECT 1 FROM "pipeline_stages" ps
  WHERE ps."empresaId" = e."id" AND ps."ordem" = d.ordem
);

-- Assign existing leads without stage to stage "Novo"
UPDATE "leads" l
SET "stageId" = ps."id"
FROM "pipeline_stages" ps
WHERE l."stageId" IS NULL
  AND ps."empresaId" = l."empresaId"
  AND ps."ordem" = 1
  AND ps."ativo" = true;
