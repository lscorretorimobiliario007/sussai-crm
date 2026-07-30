-- MVP stabilization: indexes for hot list/dashboard paths
CREATE INDEX IF NOT EXISTS "Contrato_empresaId_status_idx" ON "Contrato"("empresaId", "status");
CREATE INDEX IF NOT EXISTS "Contrato_empresaId_corretorId_idx" ON "Contrato"("empresaId", "corretorId");
CREATE INDEX IF NOT EXISTS "Contrato_empresaId_imovelId_idx" ON "Contrato"("empresaId", "imovelId");
CREATE INDEX IF NOT EXISTS "Contrato_empresaId_clienteId_idx" ON "Contrato"("empresaId", "clienteId");

CREATE INDEX IF NOT EXISTS "Cobranca_empresaId_status_vencimento_idx" ON "Cobranca"("empresaId", "status", "vencimento");
CREATE INDEX IF NOT EXISTS "Cobranca_empresaId_contratoId_idx" ON "Cobranca"("empresaId", "contratoId");

CREATE INDEX IF NOT EXISTS "Tarefa_empresaId_usuarioId_status_idx" ON "Tarefa"("empresaId", "usuarioId", "status");
CREATE INDEX IF NOT EXISTS "Tarefa_empresaId_dataLimite_idx" ON "Tarefa"("empresaId", "dataLimite");
