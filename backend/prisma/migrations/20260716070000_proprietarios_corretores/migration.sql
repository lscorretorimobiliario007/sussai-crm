-- Sprint 6: Proprietários (dados bancários) + Corretores (perfil/performance)
CREATE TYPE "StatusCorretor" AS ENUM ('ATIVO', 'INATIVO', 'FERIAS');
CREATE TYPE "TipoContaBancaria" AS ENUM ('CORRENTE', 'POUPANCA', 'PAGAMENTO');
CREATE TYPE "AcaoHistoricoCorretor" AS ENUM (
  'CRIADO', 'ATUALIZADO', 'STATUS_ALTERADO', 'FOTO_ATUALIZADA', 'META_ATUALIZADA', 'EQUIPE_ALTERADA'
);

CREATE TABLE "ClienteDadosBancarios" (
  "id" SERIAL PRIMARY KEY,
  "empresaId" INTEGER NOT NULL,
  "clienteId" INTEGER NOT NULL,
  "banco" TEXT NOT NULL,
  "agencia" TEXT,
  "conta" TEXT,
  "tipoConta" "TipoContaBancaria" NOT NULL DEFAULT 'CORRENTE',
  "pix" TEXT,
  "titular" TEXT,
  "documentoTitular" TEXT,
  "principal" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "CorretorEquipe" (
  "id" SERIAL PRIMARY KEY,
  "empresaId" INTEGER NOT NULL,
  "nome" TEXT NOT NULL,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "Usuario"
  ADD COLUMN "fotoUrl" TEXT,
  ADD COLUMN "fotoArquivo" TEXT,
  ADD COLUMN "creci" TEXT,
  ADD COLUMN "crea" TEXT,
  ADD COLUMN "comissaoPadrao" DOUBLE PRECISION NOT NULL DEFAULT 5,
  ADD COLUMN "metaMensal" DOUBLE PRECISION,
  ADD COLUMN "statusCorretor" "StatusCorretor" NOT NULL DEFAULT 'ATIVO',
  ADD COLUMN "equipeId" INTEGER,
  ADD COLUMN "permissoes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE TABLE "CorretorHistorico" (
  "id" SERIAL PRIMARY KEY,
  "empresaId" INTEGER NOT NULL,
  "usuarioId" INTEGER NOT NULL,
  "autorId" INTEGER NOT NULL,
  "acao" "AcaoHistoricoCorretor" NOT NULL,
  "alteracoes" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "ClienteDadosBancarios"
  ADD CONSTRAINT "ClienteDadosBancarios_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "ClienteDadosBancarios_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CorretorEquipe"
  ADD CONSTRAINT "CorretorEquipe_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Usuario"
  ADD CONSTRAINT "Usuario_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "CorretorEquipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CorretorHistorico"
  ADD CONSTRAINT "CorretorHistorico_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "CorretorHistorico_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "CorretorHistorico_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "ClienteDadosBancarios_empresaId_clienteId_idx" ON "ClienteDadosBancarios"("empresaId", "clienteId");
CREATE INDEX "CorretorEquipe_empresaId_ativo_idx" ON "CorretorEquipe"("empresaId", "ativo");
CREATE INDEX "Usuario_empresaId_ativo_idx" ON "Usuario"("empresaId", "ativo");
CREATE INDEX "Usuario_empresaId_statusCorretor_idx" ON "Usuario"("empresaId", "statusCorretor");
CREATE INDEX "Usuario_empresaId_equipeId_idx" ON "Usuario"("empresaId", "equipeId");
CREATE INDEX "CorretorHistorico_empresaId_usuarioId_createdAt_idx" ON "CorretorHistorico"("empresaId", "usuarioId", "createdAt");

-- Usuários existentes: status alinhado ao flag ativo
UPDATE "Usuario" SET "statusCorretor" = CASE WHEN "ativo" THEN 'ATIVO'::"StatusCorretor" ELSE 'INATIVO'::"StatusCorretor" END;
