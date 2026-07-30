-- Sprint 5: Pipeline Comercial CRM completo
CREATE TYPE "TipoEtapaPipeline" AS ENUM ('ABERTA', 'GANHO', 'PERDIDO');
CREATE TYPE "AcaoHistoricoLead" AS ENUM (
  'CRIADO', 'ATUALIZADO', 'MOVIDO', 'COMENTARIO',
  'ANEXO_ADICIONADO', 'ANEXO_REMOVIDO', 'TAREFA_VINCULADA',
  'AGENDA_VINCULADA', 'GANHO', 'PERDIDO', 'REABERTO'
);

CREATE TABLE "PipelineEtapa" (
  "id" SERIAL PRIMARY KEY,
  "empresaId" INTEGER NOT NULL,
  "nome" TEXT NOT NULL,
  "codigo" TEXT NOT NULL,
  "ordem" INTEGER NOT NULL,
  "cor" TEXT NOT NULL DEFAULT '#2563eb',
  "tipo" "TipoEtapaPipeline" NOT NULL DEFAULT 'ABERTA',
  "probabilidadePadrao" INTEGER NOT NULL DEFAULT 10,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "Lead"
  ADD COLUMN "etapaId" INTEGER,
  ADD COLUMN "valorPrevisto" DOUBLE PRECISION,
  ADD COLUMN "probabilidade" INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN "previsaoFechamento" TIMESTAMP(3),
  ADD COLUMN "motivoPerda" TEXT,
  ADD COLUMN "ativo" BOOLEAN NOT NULL DEFAULT true;

UPDATE "Lead" SET "valorPrevisto" = "valor" WHERE "valor" IS NOT NULL;

-- Etapas padrão por empresa existente
INSERT INTO "PipelineEtapa" ("empresaId", "nome", "codigo", "ordem", "cor", "tipo", "probabilidadePadrao")
SELECT e."id", d.nome, d.codigo, d.ordem, d.cor, d.tipo::"TipoEtapaPipeline", d.prob
FROM "Empresa" e
CROSS JOIN (VALUES
  ('Leads', 'LEAD', 1, '#64748b', 'ABERTA', 10),
  ('Oportunidades', 'OPORTUNIDADE', 2, '#2563eb', 'ABERTA', 25),
  ('Propostas', 'PROPOSTA', 3, '#d97706', 'ABERTA', 50),
  ('Negociações', 'NEGOCIACAO', 4, '#7c3aed', 'ABERTA', 75),
  ('Ganho', 'GANHO', 5, '#16a34a', 'GANHO', 100),
  ('Perdido', 'PERDIDO', 6, '#dc2626', 'PERDIDO', 0)
) AS d(nome, codigo, ordem, cor, tipo, prob);

-- Mapear status legado → etapas
UPDATE "Lead" l
SET "etapaId" = pe."id",
    "probabilidade" = pe."probabilidadePadrao"
FROM "PipelineEtapa" pe
WHERE pe."empresaId" = l."empresaId"
  AND pe."codigo" = CASE l."status"::text
    WHEN 'NOVO' THEN 'LEAD'
    WHEN 'CONTATO' THEN 'OPORTUNIDADE'
    WHEN 'VISITA_AGENDADA' THEN 'OPORTUNIDADE'
    WHEN 'PROPOSTA' THEN 'PROPOSTA'
    WHEN 'NEGOCIACAO' THEN 'NEGOCIACAO'
    WHEN 'FECHADO' THEN 'GANHO'
    WHEN 'PERDIDO' THEN 'PERDIDO'
    ELSE 'LEAD'
  END;

CREATE TABLE "LeadHistorico" (
  "id" SERIAL PRIMARY KEY,
  "empresaId" INTEGER NOT NULL,
  "leadId" INTEGER NOT NULL,
  "usuarioId" INTEGER NOT NULL,
  "acao" "AcaoHistoricoLead" NOT NULL,
  "alteracoes" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "LeadComentario" (
  "id" SERIAL PRIMARY KEY,
  "empresaId" INTEGER NOT NULL,
  "leadId" INTEGER NOT NULL,
  "usuarioId" INTEGER NOT NULL,
  "conteudo" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "LeadAnexo" (
  "id" SERIAL PRIMARY KEY,
  "empresaId" INTEGER NOT NULL,
  "leadId" INTEGER NOT NULL,
  "nome" TEXT NOT NULL,
  "nomeArquivo" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "tamanho" INTEGER NOT NULL,
  "url" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "PipelineEtapa"
  ADD CONSTRAINT "PipelineEtapa_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Lead"
  ADD CONSTRAINT "Lead_etapaId_fkey" FOREIGN KEY ("etapaId") REFERENCES "PipelineEtapa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LeadHistorico"
  ADD CONSTRAINT "LeadHistorico_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "LeadHistorico_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "LeadHistorico_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "LeadComentario"
  ADD CONSTRAINT "LeadComentario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "LeadComentario_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "LeadComentario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "LeadAnexo"
  ADD CONSTRAINT "LeadAnexo_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "LeadAnexo_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "PipelineEtapa_empresaId_codigo_key" ON "PipelineEtapa"("empresaId", "codigo");
CREATE INDEX "PipelineEtapa_empresaId_ordem_idx" ON "PipelineEtapa"("empresaId", "ordem");
CREATE INDEX "Lead_empresaId_ativo_updatedAt_idx" ON "Lead"("empresaId", "ativo", "updatedAt");
CREATE INDEX "Lead_empresaId_etapaId_idx" ON "Lead"("empresaId", "etapaId");
CREATE INDEX "Lead_empresaId_status_idx" ON "Lead"("empresaId", "status");
CREATE INDEX "Lead_empresaId_corretorId_idx" ON "Lead"("empresaId", "corretorId");
CREATE INDEX "LeadHistorico_empresaId_leadId_createdAt_idx" ON "LeadHistorico"("empresaId", "leadId", "createdAt");
CREATE INDEX "LeadHistorico_empresaId_createdAt_idx" ON "LeadHistorico"("empresaId", "createdAt");
CREATE INDEX "LeadComentario_empresaId_leadId_createdAt_idx" ON "LeadComentario"("empresaId", "leadId", "createdAt");
CREATE INDEX "LeadAnexo_empresaId_leadId_idx" ON "LeadAnexo"("empresaId", "leadId");
