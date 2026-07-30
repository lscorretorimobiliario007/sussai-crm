-- Sprint 7: módulo financeiro completo

-- Enums
CREATE TYPE "TipoLancamentoFinanceiro" AS ENUM ('A_RECEBER', 'A_PAGAR');
CREATE TYPE "StatusLancamentoFinanceiro" AS ENUM ('ABERTO', 'PARCIAL', 'LIQUIDADO', 'ATRASADO', 'CANCELADO');
CREATE TYPE "TipoCategoriaFinanceira" AS ENUM ('RECEITA', 'DESPESA');
CREATE TYPE "StatusComissao" AS ENUM ('PREVISTA', 'APROVADA', 'PAGA', 'CANCELADA');
CREATE TYPE "StatusCaixaDiario" AS ENUM ('ABERTO', 'FECHADO');
CREATE TYPE "TipoMovimentoCaixa" AS ENUM ('ENTRADA', 'SAIDA');
CREATE TYPE "StatusConciliacao" AS ENUM ('ABERTA', 'CONCILIADA', 'CANCELADA');
CREATE TYPE "FormaPagamentoFinanceiro" AS ENUM ('PIX', 'TED', 'DINHEIRO', 'CARTAO', 'BOLETO', 'CHEQUE', 'OUTRO');

-- Catalog
CREATE TABLE "CentroCusto" (
  "id" SERIAL PRIMARY KEY,
  "empresaId" INTEGER NOT NULL,
  "nome" TEXT NOT NULL,
  "codigo" TEXT,
  "descricao" TEXT,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CentroCusto_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "CentroCusto_empresaId_codigo_key" ON "CentroCusto"("empresaId", "codigo");
CREATE INDEX "CentroCusto_empresaId_ativo_idx" ON "CentroCusto"("empresaId", "ativo");

CREATE TABLE "CategoriaFinanceira" (
  "id" SERIAL PRIMARY KEY,
  "empresaId" INTEGER NOT NULL,
  "nome" TEXT NOT NULL,
  "tipo" "TipoCategoriaFinanceira" NOT NULL,
  "codigo" TEXT,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CategoriaFinanceira_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "CategoriaFinanceira_empresaId_codigo_key" ON "CategoriaFinanceira"("empresaId", "codigo");
CREATE INDEX "CategoriaFinanceira_empresaId_tipo_ativo_idx" ON "CategoriaFinanceira"("empresaId", "tipo", "ativo");

CREATE TABLE "LancamentoFinanceiro" (
  "id" SERIAL PRIMARY KEY,
  "empresaId" INTEGER NOT NULL,
  "tipo" "TipoLancamentoFinanceiro" NOT NULL,
  "descricao" TEXT NOT NULL,
  "valor" DOUBLE PRECISION NOT NULL,
  "valorPago" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "vencimento" TIMESTAMP(3) NOT NULL,
  "dataPagamento" TIMESTAMP(3),
  "status" "StatusLancamentoFinanceiro" NOT NULL DEFAULT 'ABERTO',
  "formaPagamento" "FormaPagamentoFinanceiro",
  "categoriaId" INTEGER,
  "centroCustoId" INTEGER,
  "clienteId" INTEGER,
  "contratoId" INTEGER,
  "corretorId" INTEGER,
  "competencia" TIMESTAMP(3),
  "observacoes" TEXT,
  "conciliado" BOOLEAN NOT NULL DEFAULT false,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LancamentoFinanceiro_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "LancamentoFinanceiro_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "CategoriaFinanceira"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "LancamentoFinanceiro_centroCustoId_fkey" FOREIGN KEY ("centroCustoId") REFERENCES "CentroCusto"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "LancamentoFinanceiro_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "LancamentoFinanceiro_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "LancamentoFinanceiro_corretorId_fkey" FOREIGN KEY ("corretorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "LancamentoFinanceiro_empresaId_tipo_status_idx" ON "LancamentoFinanceiro"("empresaId", "tipo", "status");
CREATE INDEX "LancamentoFinanceiro_empresaId_vencimento_idx" ON "LancamentoFinanceiro"("empresaId", "vencimento");
CREATE INDEX "LancamentoFinanceiro_empresaId_ativo_createdAt_idx" ON "LancamentoFinanceiro"("empresaId", "ativo", "createdAt");
CREATE INDEX "LancamentoFinanceiro_empresaId_clienteId_idx" ON "LancamentoFinanceiro"("empresaId", "clienteId");
CREATE INDEX "LancamentoFinanceiro_empresaId_contratoId_idx" ON "LancamentoFinanceiro"("empresaId", "contratoId");
CREATE INDEX "LancamentoFinanceiro_empresaId_corretorId_idx" ON "LancamentoFinanceiro"("empresaId", "corretorId");
CREATE INDEX "LancamentoFinanceiro_empresaId_conciliado_idx" ON "LancamentoFinanceiro"("empresaId", "conciliado");

CREATE TABLE "Comissao" (
  "id" SERIAL PRIMARY KEY,
  "empresaId" INTEGER NOT NULL,
  "corretorId" INTEGER NOT NULL,
  "contratoId" INTEGER,
  "lancamentoId" INTEGER,
  "centroCustoId" INTEGER,
  "descricao" TEXT NOT NULL,
  "valorBase" DOUBLE PRECISION NOT NULL,
  "percentual" DOUBLE PRECISION NOT NULL,
  "valor" DOUBLE PRECISION NOT NULL,
  "status" "StatusComissao" NOT NULL DEFAULT 'PREVISTA',
  "competencia" TIMESTAMP(3) NOT NULL,
  "dataPagamento" TIMESTAMP(3),
  "observacoes" TEXT,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Comissao_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Comissao_corretorId_fkey" FOREIGN KEY ("corretorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Comissao_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Comissao_lancamentoId_fkey" FOREIGN KEY ("lancamentoId") REFERENCES "LancamentoFinanceiro"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Comissao_centroCustoId_fkey" FOREIGN KEY ("centroCustoId") REFERENCES "CentroCusto"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "Comissao_empresaId_status_competencia_idx" ON "Comissao"("empresaId", "status", "competencia");
CREATE INDEX "Comissao_empresaId_corretorId_idx" ON "Comissao"("empresaId", "corretorId");
CREATE INDEX "Comissao_empresaId_contratoId_idx" ON "Comissao"("empresaId", "contratoId");

CREATE TABLE "CaixaDiario" (
  "id" SERIAL PRIMARY KEY,
  "empresaId" INTEGER NOT NULL,
  "data" TIMESTAMP(3) NOT NULL,
  "saldoInicial" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "saldoFinal" DOUBLE PRECISION,
  "status" "StatusCaixaDiario" NOT NULL DEFAULT 'ABERTO',
  "observacoes" TEXT,
  "fechadoPorId" INTEGER,
  "fechadoEm" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CaixaDiario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "CaixaDiario_fechadoPorId_fkey" FOREIGN KEY ("fechadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "CaixaDiario_empresaId_data_key" ON "CaixaDiario"("empresaId", "data");
CREATE INDEX "CaixaDiario_empresaId_status_data_idx" ON "CaixaDiario"("empresaId", "status", "data");

CREATE TABLE "MovimentoCaixa" (
  "id" SERIAL PRIMARY KEY,
  "empresaId" INTEGER NOT NULL,
  "caixaDiarioId" INTEGER NOT NULL,
  "tipo" "TipoMovimentoCaixa" NOT NULL,
  "descricao" TEXT NOT NULL,
  "valor" DOUBLE PRECISION NOT NULL,
  "formaPagamento" "FormaPagamentoFinanceiro",
  "lancamentoId" INTEGER,
  "comissaoId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MovimentoCaixa_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "MovimentoCaixa_caixaDiarioId_fkey" FOREIGN KEY ("caixaDiarioId") REFERENCES "CaixaDiario"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MovimentoCaixa_lancamentoId_fkey" FOREIGN KEY ("lancamentoId") REFERENCES "LancamentoFinanceiro"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "MovimentoCaixa_comissaoId_fkey" FOREIGN KEY ("comissaoId") REFERENCES "Comissao"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "MovimentoCaixa_empresaId_caixaDiarioId_idx" ON "MovimentoCaixa"("empresaId", "caixaDiarioId");
CREATE INDEX "MovimentoCaixa_empresaId_createdAt_idx" ON "MovimentoCaixa"("empresaId", "createdAt");

CREATE TABLE "Conciliacao" (
  "id" SERIAL PRIMARY KEY,
  "empresaId" INTEGER NOT NULL,
  "titulo" TEXT NOT NULL,
  "periodoInicio" TIMESTAMP(3) NOT NULL,
  "periodoFim" TIMESTAMP(3) NOT NULL,
  "status" "StatusConciliacao" NOT NULL DEFAULT 'ABERTA',
  "saldoExtrato" DOUBLE PRECISION,
  "saldoSistema" DOUBLE PRECISION,
  "observacoes" TEXT,
  "criadoPorId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Conciliacao_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Conciliacao_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "Conciliacao_empresaId_status_periodoInicio_idx" ON "Conciliacao"("empresaId", "status", "periodoInicio");

CREATE TABLE "ConciliacaoItem" (
  "id" SERIAL PRIMARY KEY,
  "empresaId" INTEGER NOT NULL,
  "conciliacaoId" INTEGER NOT NULL,
  "lancamentoId" INTEGER,
  "movimentoCaixaId" INTEGER,
  "descricao" TEXT NOT NULL,
  "valor" DOUBLE PRECISION NOT NULL,
  "dataReferencia" TIMESTAMP(3),
  "conciliado" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConciliacaoItem_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ConciliacaoItem_conciliacaoId_fkey" FOREIGN KEY ("conciliacaoId") REFERENCES "Conciliacao"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ConciliacaoItem_lancamentoId_fkey" FOREIGN KEY ("lancamentoId") REFERENCES "LancamentoFinanceiro"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "ConciliacaoItem_movimentoCaixaId_fkey" FOREIGN KEY ("movimentoCaixaId") REFERENCES "MovimentoCaixa"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "ConciliacaoItem_empresaId_conciliacaoId_idx" ON "ConciliacaoItem"("empresaId", "conciliacaoId");

-- Extend Cobranca
ALTER TABLE "Cobranca" ADD COLUMN IF NOT EXISTS "categoriaId" INTEGER;
ALTER TABLE "Cobranca" ADD COLUMN IF NOT EXISTS "centroCustoId" INTEGER;
ALTER TABLE "Cobranca" ADD COLUMN IF NOT EXISTS "formaPagamento" "FormaPagamentoFinanceiro";
ALTER TABLE "Cobranca" ADD COLUMN IF NOT EXISTS "lancamentoId" INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS "Cobranca_lancamentoId_key" ON "Cobranca"("lancamentoId");
ALTER TABLE "Cobranca" ADD CONSTRAINT "Cobranca_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "CategoriaFinanceira"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Cobranca" ADD CONSTRAINT "Cobranca_centroCustoId_fkey" FOREIGN KEY ("centroCustoId") REFERENCES "CentroCusto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Cobranca" ADD CONSTRAINT "Cobranca_lancamentoId_fkey" FOREIGN KEY ("lancamentoId") REFERENCES "LancamentoFinanceiro"("id") ON DELETE SET NULL ON UPDATE CASCADE;
