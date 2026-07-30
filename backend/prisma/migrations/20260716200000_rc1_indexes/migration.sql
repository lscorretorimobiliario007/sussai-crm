-- RC1: índices de performance / joins frequentes (multiempresa)
CREATE INDEX IF NOT EXISTS "Cliente_empresaId_cpfCnpj_idx" ON "Cliente"("empresaId", "cpfCnpj");

CREATE INDEX IF NOT EXISTS "Lead_empresaId_clienteId_idx" ON "Lead"("empresaId", "clienteId");
CREATE INDEX IF NOT EXISTS "Lead_empresaId_imovelId_idx" ON "Lead"("empresaId", "imovelId");

CREATE INDEX IF NOT EXISTS "Tarefa_empresaId_leadId_idx" ON "Tarefa"("empresaId", "leadId");
CREATE INDEX IF NOT EXISTS "Tarefa_empresaId_clienteId_idx" ON "Tarefa"("empresaId", "clienteId");

CREATE INDEX IF NOT EXISTS "EventoAgenda_empresaId_clienteId_idx" ON "EventoAgenda"("empresaId", "clienteId");
CREATE INDEX IF NOT EXISTS "EventoAgenda_empresaId_imovelId_idx" ON "EventoAgenda"("empresaId", "imovelId");
CREATE INDEX IF NOT EXISTS "EventoAgenda_empresaId_leadId_idx" ON "EventoAgenda"("empresaId", "leadId");
