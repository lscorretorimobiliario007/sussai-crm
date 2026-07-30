-- Sprint 4: módulo completo de Agenda
CREATE TYPE "TipoEventoAgenda" AS ENUM ('VISITA', 'REUNIAO', 'LIGACAO', 'TAREFA');
CREATE TYPE "StatusEventoAgenda" AS ENUM ('AGENDADO', 'CONFIRMADO', 'CONCLUIDO', 'CANCELADO');
CREATE TYPE "FrequenciaRepeticaoAgenda" AS ENUM ('NENHUMA', 'DIARIA', 'SEMANAL', 'QUINZENAL', 'MENSAL');
CREATE TYPE "AcaoHistoricoAgenda" AS ENUM (
  'CRIADO', 'ATUALIZADO', 'REAGENDADO', 'CONFIRMADO', 'CONCLUIDO', 'CANCELADO', 'LEMBRETE_ENVIADO'
);

CREATE TABLE "EventoAgenda" (
  "id" SERIAL PRIMARY KEY,
  "empresaId" INTEGER NOT NULL,
  "usuarioId" INTEGER NOT NULL,
  "criadoPorId" INTEGER NOT NULL,
  "clienteId" INTEGER,
  "imovelId" INTEGER,
  "leadId" INTEGER,
  "eventoPaiId" INTEGER,
  "titulo" TEXT NOT NULL,
  "descricao" TEXT,
  "tipo" "TipoEventoAgenda" NOT NULL,
  "status" "StatusEventoAgenda" NOT NULL DEFAULT 'AGENDADO',
  "dataInicio" TIMESTAMP(3) NOT NULL,
  "dataFim" TIMESTAMP(3) NOT NULL,
  "diaInteiro" BOOLEAN NOT NULL DEFAULT false,
  "localizacao" TEXT,
  "repeticao" "FrequenciaRepeticaoAgenda" NOT NULL DEFAULT 'NENHUMA',
  "repeticaoAte" TIMESTAMP(3),
  "lembreteMinutos" INTEGER,
  "notificado" BOOLEAN NOT NULL DEFAULT false,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "AgendaHistorico" (
  "id" SERIAL PRIMARY KEY,
  "empresaId" INTEGER NOT NULL,
  "eventoId" INTEGER NOT NULL,
  "usuarioId" INTEGER NOT NULL,
  "acao" "AcaoHistoricoAgenda" NOT NULL,
  "alteracoes" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "AgendaNotificacao" (
  "id" SERIAL PRIMARY KEY,
  "empresaId" INTEGER NOT NULL,
  "usuarioId" INTEGER NOT NULL,
  "eventoId" INTEGER NOT NULL,
  "titulo" TEXT NOT NULL,
  "mensagem" TEXT NOT NULL,
  "lida" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "EventoAgenda"
  ADD CONSTRAINT "EventoAgenda_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "EventoAgenda_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "EventoAgenda_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "EventoAgenda_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "EventoAgenda_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "Imovel"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "EventoAgenda_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "EventoAgenda_eventoPaiId_fkey" FOREIGN KEY ("eventoPaiId") REFERENCES "EventoAgenda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AgendaHistorico"
  ADD CONSTRAINT "AgendaHistorico_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "AgendaHistorico_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "EventoAgenda"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "AgendaHistorico_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AgendaNotificacao"
  ADD CONSTRAINT "AgendaNotificacao_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "AgendaNotificacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "AgendaNotificacao_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "EventoAgenda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "EventoAgenda_empresaId_dataInicio_idx" ON "EventoAgenda"("empresaId", "dataInicio");
CREATE INDEX "EventoAgenda_empresaId_usuarioId_dataInicio_idx" ON "EventoAgenda"("empresaId", "usuarioId", "dataInicio");
CREATE INDEX "EventoAgenda_empresaId_status_idx" ON "EventoAgenda"("empresaId", "status");
CREATE INDEX "EventoAgenda_empresaId_tipo_idx" ON "EventoAgenda"("empresaId", "tipo");
CREATE INDEX "EventoAgenda_empresaId_ativo_dataInicio_idx" ON "EventoAgenda"("empresaId", "ativo", "dataInicio");
CREATE INDEX "AgendaHistorico_empresaId_eventoId_createdAt_idx" ON "AgendaHistorico"("empresaId", "eventoId", "createdAt");
CREATE INDEX "AgendaHistorico_empresaId_createdAt_idx" ON "AgendaHistorico"("empresaId", "createdAt");
CREATE INDEX "AgendaNotificacao_empresaId_usuarioId_lida_createdAt_idx" ON "AgendaNotificacao"("empresaId", "usuarioId", "lida", "createdAt");
CREATE INDEX "AgendaNotificacao_empresaId_eventoId_idx" ON "AgendaNotificacao"("empresaId", "eventoId");
