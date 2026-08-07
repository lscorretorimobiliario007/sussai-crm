-- CreateEnum
CREATE TYPE "public"."PlanoEmpresa" AS ENUM ('STARTER', 'PROFESSIONAL', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "public"."StatusCorretor" AS ENUM ('ATIVO', 'INATIVO', 'FERIAS');

-- CreateEnum
CREATE TYPE "public"."AcaoHistoricoCorretor" AS ENUM ('CRIADO', 'ATUALIZADO', 'STATUS_ALTERADO', 'FOTO_ATUALIZADA', 'META_ATUALIZADA', 'EQUIPE_ALTERADA');

-- CreateEnum
CREATE TYPE "public"."TipoCliente" AS ENUM ('PROPRIETARIO', 'INQUILINO', 'COMPRADOR', 'LEAD');

-- CreateEnum
CREATE TYPE "public"."TipoPessoa" AS ENUM ('PF', 'PJ');

-- CreateEnum
CREATE TYPE "public"."StatusCliente" AS ENUM ('PROSPECTO', 'QUALIFICADO', 'NEGOCIACAO', 'CLIENTE', 'INATIVO', 'PERDIDO');

-- CreateEnum
CREATE TYPE "public"."InteresseCliente" AS ENUM ('COMPRA', 'VENDA', 'LOCACAO', 'ADMINISTRACAO');

-- CreateEnum
CREATE TYPE "public"."AcaoHistoricoCliente" AS ENUM ('CRIADO', 'ATUALIZADO', 'DESATIVADO', 'REATIVADO', 'ANOTACAO', 'INTERACAO', 'DOCUMENTO_ADICIONADO', 'DOCUMENTO_REMOVIDO', 'AVATAR_ATUALIZADO', 'FAVORITO_ADICIONADO', 'FAVORITO_REMOVIDO', 'COMPARTILHADO', 'VISITA_REGISTRADA', 'PROPOSTA_REGISTRADA');

-- CreateEnum
CREATE TYPE "public"."TipoDocumentoCliente" AS ENUM ('CPF', 'CNPJ', 'RG', 'COMPROVANTE_RESIDENCIA', 'CONTRATO', 'OUTRO');

-- CreateEnum
CREATE TYPE "public"."TipoInteracaoCliente" AS ENUM ('LIGACAO', 'EMAIL', 'WHATSAPP', 'VISITA', 'REUNIAO', 'OUTRO');

-- CreateEnum
CREATE TYPE "public"."StatusVisitaCliente" AS ENUM ('AGENDADA', 'REALIZADA', 'CANCELADA', 'NAO_COMPARECEU');

-- CreateEnum
CREATE TYPE "public"."StatusPropostaCliente" AS ENUM ('RASCUNHO', 'ENVIADA', 'EM_ANALISE', 'ACEITA', 'RECUSADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "public"."TipoEventoAgenda" AS ENUM ('VISITA', 'REUNIAO', 'LIGACAO', 'TAREFA');

-- CreateEnum
CREATE TYPE "public"."StatusEventoAgenda" AS ENUM ('AGENDADO', 'CONFIRMADO', 'CONCLUIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "public"."PrioridadeTarefa" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'URGENTE');

-- CreateEnum
CREATE TYPE "public"."StatusTarefa" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "public"."TipoContrato" AS ENUM ('ALUGUEL', 'VENDA', 'ADMINISTRACAO');

-- CreateEnum
CREATE TYPE "public"."StatusContrato" AS ENUM ('RASCUNHO', 'ATIVO', 'ENCERRADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "public"."StatusCobranca" AS ENUM ('PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "public"."TipoLancamentoFinanceiro" AS ENUM ('A_RECEBER', 'A_PAGAR');

-- CreateEnum
CREATE TYPE "public"."StatusLancamentoFinanceiro" AS ENUM ('ABERTO', 'PARCIAL', 'LIQUIDADO', 'ATRASADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "public"."TipoCategoriaFinanceira" AS ENUM ('RECEITA', 'DESPESA');

-- CreateEnum
CREATE TYPE "public"."StatusComissao" AS ENUM ('PREVISTA', 'APROVADA', 'PAGA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "public"."StatusCaixaDiario" AS ENUM ('ABERTO', 'FECHADO');

-- CreateEnum
CREATE TYPE "public"."TipoMovimentoCaixa" AS ENUM ('ENTRADA', 'SAIDA');

-- CreateEnum
CREATE TYPE "public"."StatusConciliacao" AS ENUM ('ABERTA', 'CONCILIADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "public"."FormaPagamentoFinanceiro" AS ENUM ('PIX', 'TED', 'DINHEIRO', 'CARTAO', 'BOLETO', 'CHEQUE', 'OUTRO');

-- CreateEnum
CREATE TYPE "public"."BackupStatus" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO', 'FALHOU');

-- CreateEnum
CREATE TYPE "public"."SystemLogLevel" AS ENUM ('DEBUG', 'INFO', 'WARN', 'ERROR');

-- AlterTable
ALTER TABLE "public"."Empresa" ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "cep" TEXT,
ADD COLUMN     "cidade" TEXT,
ADD COLUMN     "endereco" TEXT,
ADD COLUMN     "estado" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "nomeFantasia" TEXT,
ADD COLUMN     "plano" "public"."PlanoEmpresa" NOT NULL DEFAULT 'STARTER',
ADD COLUMN     "razaoSocial" TEXT,
ADD COLUMN     "siteUrl" TEXT,
ADD COLUMN     "whatsapp" TEXT;

-- AlterTable
ALTER TABLE "public"."Usuario" ADD COLUMN     "comissaoPadrao" DOUBLE PRECISION NOT NULL DEFAULT 5,
ADD COLUMN     "crea" TEXT,
ADD COLUMN     "creci" TEXT,
ADD COLUMN     "equipeId" INTEGER,
ADD COLUMN     "fotoUrl" TEXT,
ADD COLUMN     "metaMensal" DOUBLE PRECISION,
ADD COLUMN     "permissoes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "statusCorretor" "public"."StatusCorretor" NOT NULL DEFAULT 'ATIVO',
ADD COLUMN     "telefone" TEXT;

-- CreateTable
CREATE TABLE "public"."Cliente" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "corretorId" INTEGER,
    "tipo" "public"."TipoCliente" NOT NULL DEFAULT 'LEAD',
    "tipoPessoa" "public"."TipoPessoa" NOT NULL DEFAULT 'PF',
    "status" "public"."StatusCliente" NOT NULL DEFAULT 'PROSPECTO',
    "nome" TEXT NOT NULL,
    "razaoSocial" TEXT,
    "nomeFantasia" TEXT,
    "cpfCnpj" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "whatsapp" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "notas" TEXT,
    "origem" TEXT,
    "interesses" "public"."InteresseCliente"[] DEFAULT ARRAY[]::"public"."InteresseCliente"[],
    "faixaPrecoMin" DOUBLE PRECISION,
    "faixaPrecoMax" DOUBLE PRECISION,
    "cidadesInteresse" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "avatarUrl" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClienteAnotacao" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "conteudo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClienteAnotacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClienteInteracao" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "propertyId" INTEGER,
    "tipo" "public"."TipoInteracaoCliente" NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClienteInteracao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClienteDocumento" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "tipo" "public"."TipoDocumentoCliente" NOT NULL DEFAULT 'OUTRO',
    "nome" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClienteDocumento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClienteFavorito" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClienteFavorito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClienteVisita" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "status" "public"."StatusVisitaCliente" NOT NULL DEFAULT 'AGENDADA',
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClienteVisita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClienteProposta" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "status" "public"."StatusPropostaCliente" NOT NULL DEFAULT 'RASCUNHO',
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClienteProposta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClienteHistorico" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "acao" "public"."AcaoHistoricoCliente" NOT NULL,
    "alteracoes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClienteHistorico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EventoAgenda" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" "public"."TipoEventoAgenda" NOT NULL,
    "status" "public"."StatusEventoAgenda" NOT NULL DEFAULT 'AGENDADO',
    "inicio" TIMESTAMP(3) NOT NULL,
    "fim" TIMESTAMP(3) NOT NULL,
    "diaInteiro" BOOLEAN NOT NULL DEFAULT false,
    "local" TEXT,
    "descricao" TEXT,
    "clienteId" INTEGER,
    "propertyId" INTEGER,
    "leadId" INTEGER,
    "usuarioId" INTEGER,
    "createdById" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventoAgenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AgendaNotificacao" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "eventoId" INTEGER,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgendaNotificacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Tarefa" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "status" "public"."StatusTarefa" NOT NULL DEFAULT 'PENDENTE',
    "prioridade" "public"."PrioridadeTarefa" NOT NULL DEFAULT 'MEDIA',
    "vencimento" TIMESTAMP(3),
    "responsavelId" INTEGER,
    "leadId" INTEGER,
    "clienteId" INTEGER,
    "propertyId" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tarefa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Contrato" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "tipo" "public"."TipoContrato" NOT NULL,
    "status" "public"."StatusContrato" NOT NULL DEFAULT 'RASCUNHO',
    "valor" DOUBLE PRECISION NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "clienteId" INTEGER NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "corretorId" INTEGER,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CategoriaFinanceira" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "public"."TipoCategoriaFinanceira" NOT NULL,
    "codigo" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoriaFinanceira_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CentroCusto" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "codigo" TEXT,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CentroCusto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LancamentoFinanceiro" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "tipo" "public"."TipoLancamentoFinanceiro" NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "valorPago" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "dataPagamento" TIMESTAMP(3),
    "status" "public"."StatusLancamentoFinanceiro" NOT NULL DEFAULT 'ABERTO',
    "formaPagamento" "public"."FormaPagamentoFinanceiro",
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LancamentoFinanceiro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Cobranca" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "contratoId" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "pagamento" TIMESTAMP(3),
    "status" "public"."StatusCobranca" NOT NULL DEFAULT 'PENDENTE',
    "categoriaId" INTEGER,
    "centroCustoId" INTEGER,
    "formaPagamento" "public"."FormaPagamentoFinanceiro",
    "lancamentoId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cobranca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Comissao" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "corretorId" INTEGER NOT NULL,
    "contratoId" INTEGER,
    "lancamentoId" INTEGER,
    "centroCustoId" INTEGER,
    "descricao" TEXT NOT NULL,
    "valorBase" DOUBLE PRECISION NOT NULL,
    "percentual" DOUBLE PRECISION NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "status" "public"."StatusComissao" NOT NULL DEFAULT 'PREVISTA',
    "competencia" TIMESTAMP(3) NOT NULL,
    "dataPagamento" TIMESTAMP(3),
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comissao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CaixaDiario" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "saldoInicial" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saldoFinal" DOUBLE PRECISION,
    "status" "public"."StatusCaixaDiario" NOT NULL DEFAULT 'ABERTO',
    "observacoes" TEXT,
    "fechadoPorId" INTEGER,
    "fechadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaixaDiario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MovimentoCaixa" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "caixaDiarioId" INTEGER NOT NULL,
    "tipo" "public"."TipoMovimentoCaixa" NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "formaPagamento" "public"."FormaPagamentoFinanceiro",
    "lancamentoId" INTEGER,
    "comissaoId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimentoCaixa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Conciliacao" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "periodoInicio" TIMESTAMP(3) NOT NULL,
    "periodoFim" TIMESTAMP(3) NOT NULL,
    "status" "public"."StatusConciliacao" NOT NULL DEFAULT 'ABERTA',
    "saldoExtrato" DOUBLE PRECISION,
    "saldoSistema" DOUBLE PRECISION,
    "observacoes" TEXT,
    "criadoPorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conciliacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ConciliacaoItem" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "conciliacaoId" INTEGER NOT NULL,
    "lancamentoId" INTEGER,
    "movimentoCaixaId" INTEGER,
    "descricao" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "dataReferencia" TIMESTAMP(3),
    "conciliado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConciliacaoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CorretorEquipe" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CorretorEquipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CorretorHistorico" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "autorId" INTEGER NOT NULL,
    "acao" "public"."AcaoHistoricoCorretor" NOT NULL,
    "alteracoes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CorretorHistorico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER,
    "userId" INTEGER,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "meta" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SystemLog" (
    "id" SERIAL NOT NULL,
    "level" "public"."SystemLogLevel" NOT NULL DEFAULT 'INFO',
    "message" TEXT NOT NULL,
    "context" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AppNotification" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "userId" INTEGER,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Documento" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "uploadedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IntegrationConfig" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BackupRecord" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER,
    "status" "public"."BackupStatus" NOT NULL DEFAULT 'PENDENTE',
    "filePath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "BackupRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Cliente_empresaId_ativo_createdAt_idx" ON "public"."Cliente"("empresaId", "ativo", "createdAt");

-- CreateIndex
CREATE INDEX "Cliente_empresaId_tipo_idx" ON "public"."Cliente"("empresaId", "tipo");

-- CreateIndex
CREATE INDEX "Cliente_empresaId_status_idx" ON "public"."Cliente"("empresaId", "status");

-- CreateIndex
CREATE INDEX "Cliente_empresaId_corretorId_idx" ON "public"."Cliente"("empresaId", "corretorId");

-- CreateIndex
CREATE INDEX "Cliente_empresaId_cidade_idx" ON "public"."Cliente"("empresaId", "cidade");

-- CreateIndex
CREATE INDEX "Cliente_empresaId_cpfCnpj_idx" ON "public"."Cliente"("empresaId", "cpfCnpj");

-- CreateIndex
CREATE INDEX "ClienteAnotacao_empresaId_clienteId_createdAt_idx" ON "public"."ClienteAnotacao"("empresaId", "clienteId", "createdAt");

-- CreateIndex
CREATE INDEX "ClienteInteracao_empresaId_clienteId_dataHora_idx" ON "public"."ClienteInteracao"("empresaId", "clienteId", "dataHora");

-- CreateIndex
CREATE INDEX "ClienteDocumento_empresaId_clienteId_idx" ON "public"."ClienteDocumento"("empresaId", "clienteId");

-- CreateIndex
CREATE INDEX "ClienteFavorito_empresaId_clienteId_idx" ON "public"."ClienteFavorito"("empresaId", "clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "ClienteFavorito_clienteId_propertyId_key" ON "public"."ClienteFavorito"("clienteId", "propertyId");

-- CreateIndex
CREATE INDEX "ClienteVisita_empresaId_clienteId_dataHora_idx" ON "public"."ClienteVisita"("empresaId", "clienteId", "dataHora");

-- CreateIndex
CREATE INDEX "ClienteVisita_empresaId_propertyId_idx" ON "public"."ClienteVisita"("empresaId", "propertyId");

-- CreateIndex
CREATE INDEX "ClienteProposta_empresaId_clienteId_createdAt_idx" ON "public"."ClienteProposta"("empresaId", "clienteId", "createdAt");

-- CreateIndex
CREATE INDEX "ClienteProposta_empresaId_propertyId_idx" ON "public"."ClienteProposta"("empresaId", "propertyId");

-- CreateIndex
CREATE INDEX "ClienteHistorico_empresaId_clienteId_createdAt_idx" ON "public"."ClienteHistorico"("empresaId", "clienteId", "createdAt");

-- CreateIndex
CREATE INDEX "EventoAgenda_empresaId_inicio_idx" ON "public"."EventoAgenda"("empresaId", "inicio");

-- CreateIndex
CREATE INDEX "EventoAgenda_empresaId_usuarioId_inicio_idx" ON "public"."EventoAgenda"("empresaId", "usuarioId", "inicio");

-- CreateIndex
CREATE INDEX "EventoAgenda_empresaId_status_idx" ON "public"."EventoAgenda"("empresaId", "status");

-- CreateIndex
CREATE INDEX "EventoAgenda_empresaId_tipo_idx" ON "public"."EventoAgenda"("empresaId", "tipo");

-- CreateIndex
CREATE INDEX "EventoAgenda_empresaId_ativo_inicio_idx" ON "public"."EventoAgenda"("empresaId", "ativo", "inicio");

-- CreateIndex
CREATE INDEX "EventoAgenda_empresaId_clienteId_idx" ON "public"."EventoAgenda"("empresaId", "clienteId");

-- CreateIndex
CREATE INDEX "EventoAgenda_empresaId_propertyId_idx" ON "public"."EventoAgenda"("empresaId", "propertyId");

-- CreateIndex
CREATE INDEX "EventoAgenda_empresaId_leadId_idx" ON "public"."EventoAgenda"("empresaId", "leadId");

-- CreateIndex
CREATE INDEX "AgendaNotificacao_empresaId_usuarioId_lida_createdAt_idx" ON "public"."AgendaNotificacao"("empresaId", "usuarioId", "lida", "createdAt");

-- CreateIndex
CREATE INDEX "AgendaNotificacao_empresaId_eventoId_idx" ON "public"."AgendaNotificacao"("empresaId", "eventoId");

-- CreateIndex
CREATE INDEX "Tarefa_empresaId_status_ativo_idx" ON "public"."Tarefa"("empresaId", "status", "ativo");

-- CreateIndex
CREATE INDEX "Tarefa_empresaId_responsavelId_status_idx" ON "public"."Tarefa"("empresaId", "responsavelId", "status");

-- CreateIndex
CREATE INDEX "Tarefa_empresaId_vencimento_idx" ON "public"."Tarefa"("empresaId", "vencimento");

-- CreateIndex
CREATE INDEX "Tarefa_empresaId_leadId_idx" ON "public"."Tarefa"("empresaId", "leadId");

-- CreateIndex
CREATE INDEX "Tarefa_empresaId_clienteId_idx" ON "public"."Tarefa"("empresaId", "clienteId");

-- CreateIndex
CREATE INDEX "Tarefa_empresaId_propertyId_idx" ON "public"."Tarefa"("empresaId", "propertyId");

-- CreateIndex
CREATE INDEX "Contrato_empresaId_status_ativo_idx" ON "public"."Contrato"("empresaId", "status", "ativo");

-- CreateIndex
CREATE INDEX "Contrato_empresaId_corretorId_idx" ON "public"."Contrato"("empresaId", "corretorId");

-- CreateIndex
CREATE INDEX "Contrato_empresaId_propertyId_idx" ON "public"."Contrato"("empresaId", "propertyId");

-- CreateIndex
CREATE INDEX "Contrato_empresaId_clienteId_idx" ON "public"."Contrato"("empresaId", "clienteId");

-- CreateIndex
CREATE INDEX "CategoriaFinanceira_empresaId_tipo_ativo_idx" ON "public"."CategoriaFinanceira"("empresaId", "tipo", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "CategoriaFinanceira_empresaId_codigo_key" ON "public"."CategoriaFinanceira"("empresaId", "codigo");

-- CreateIndex
CREATE INDEX "CentroCusto_empresaId_ativo_idx" ON "public"."CentroCusto"("empresaId", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "CentroCusto_empresaId_codigo_key" ON "public"."CentroCusto"("empresaId", "codigo");

-- CreateIndex
CREATE INDEX "LancamentoFinanceiro_empresaId_tipo_status_idx" ON "public"."LancamentoFinanceiro"("empresaId", "tipo", "status");

-- CreateIndex
CREATE INDEX "LancamentoFinanceiro_empresaId_vencimento_idx" ON "public"."LancamentoFinanceiro"("empresaId", "vencimento");

-- CreateIndex
CREATE INDEX "LancamentoFinanceiro_empresaId_ativo_createdAt_idx" ON "public"."LancamentoFinanceiro"("empresaId", "ativo", "createdAt");

-- CreateIndex
CREATE INDEX "LancamentoFinanceiro_empresaId_clienteId_idx" ON "public"."LancamentoFinanceiro"("empresaId", "clienteId");

-- CreateIndex
CREATE INDEX "LancamentoFinanceiro_empresaId_contratoId_idx" ON "public"."LancamentoFinanceiro"("empresaId", "contratoId");

-- CreateIndex
CREATE INDEX "LancamentoFinanceiro_empresaId_corretorId_idx" ON "public"."LancamentoFinanceiro"("empresaId", "corretorId");

-- CreateIndex
CREATE INDEX "LancamentoFinanceiro_empresaId_conciliado_idx" ON "public"."LancamentoFinanceiro"("empresaId", "conciliado");

-- CreateIndex
CREATE UNIQUE INDEX "Cobranca_lancamentoId_key" ON "public"."Cobranca"("lancamentoId");

-- CreateIndex
CREATE INDEX "Cobranca_empresaId_status_vencimento_idx" ON "public"."Cobranca"("empresaId", "status", "vencimento");

-- CreateIndex
CREATE INDEX "Cobranca_empresaId_contratoId_idx" ON "public"."Cobranca"("empresaId", "contratoId");

-- CreateIndex
CREATE INDEX "Comissao_empresaId_status_competencia_idx" ON "public"."Comissao"("empresaId", "status", "competencia");

-- CreateIndex
CREATE INDEX "Comissao_empresaId_corretorId_idx" ON "public"."Comissao"("empresaId", "corretorId");

-- CreateIndex
CREATE INDEX "Comissao_empresaId_contratoId_idx" ON "public"."Comissao"("empresaId", "contratoId");

-- CreateIndex
CREATE INDEX "CaixaDiario_empresaId_status_data_idx" ON "public"."CaixaDiario"("empresaId", "status", "data");

-- CreateIndex
CREATE UNIQUE INDEX "CaixaDiario_empresaId_data_key" ON "public"."CaixaDiario"("empresaId", "data");

-- CreateIndex
CREATE INDEX "MovimentoCaixa_empresaId_caixaDiarioId_idx" ON "public"."MovimentoCaixa"("empresaId", "caixaDiarioId");

-- CreateIndex
CREATE INDEX "MovimentoCaixa_empresaId_createdAt_idx" ON "public"."MovimentoCaixa"("empresaId", "createdAt");

-- CreateIndex
CREATE INDEX "Conciliacao_empresaId_status_periodoInicio_idx" ON "public"."Conciliacao"("empresaId", "status", "periodoInicio");

-- CreateIndex
CREATE INDEX "ConciliacaoItem_empresaId_conciliacaoId_idx" ON "public"."ConciliacaoItem"("empresaId", "conciliacaoId");

-- CreateIndex
CREATE INDEX "CorretorEquipe_empresaId_ativo_idx" ON "public"."CorretorEquipe"("empresaId", "ativo");

-- CreateIndex
CREATE INDEX "CorretorHistorico_empresaId_usuarioId_createdAt_idx" ON "public"."CorretorHistorico"("empresaId", "usuarioId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_empresaId_createdAt_idx" ON "public"."AuditLog"("empresaId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "public"."AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "public"."AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SystemLog_level_createdAt_idx" ON "public"."SystemLog"("level", "createdAt");

-- CreateIndex
CREATE INDEX "SystemLog_createdAt_idx" ON "public"."SystemLog"("createdAt");

-- CreateIndex
CREATE INDEX "AppNotification_empresaId_userId_lida_createdAt_idx" ON "public"."AppNotification"("empresaId", "userId", "lida", "createdAt");

-- CreateIndex
CREATE INDEX "Documento_empresaId_entityType_entityId_idx" ON "public"."Documento"("empresaId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "Documento_empresaId_createdAt_idx" ON "public"."Documento"("empresaId", "createdAt");

-- CreateIndex
CREATE INDEX "IntegrationConfig_empresaId_ativo_idx" ON "public"."IntegrationConfig"("empresaId", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationConfig_empresaId_provider_key" ON "public"."IntegrationConfig"("empresaId", "provider");

-- CreateIndex
CREATE INDEX "BackupRecord_empresaId_createdAt_idx" ON "public"."BackupRecord"("empresaId", "createdAt");

-- CreateIndex
CREATE INDEX "BackupRecord_status_createdAt_idx" ON "public"."BackupRecord"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Usuario_empresaId_statusCorretor_idx" ON "public"."Usuario"("empresaId", "statusCorretor");

-- CreateIndex
CREATE INDEX "Usuario_empresaId_equipeId_idx" ON "public"."Usuario"("empresaId", "equipeId");

-- AddForeignKey
ALTER TABLE "public"."Usuario" ADD CONSTRAINT "Usuario_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "public"."CorretorEquipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Cliente" ADD CONSTRAINT "Cliente_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Cliente" ADD CONSTRAINT "Cliente_corretorId_fkey" FOREIGN KEY ("corretorId") REFERENCES "public"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClienteAnotacao" ADD CONSTRAINT "ClienteAnotacao_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClienteAnotacao" ADD CONSTRAINT "ClienteAnotacao_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClienteAnotacao" ADD CONSTRAINT "ClienteAnotacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClienteInteracao" ADD CONSTRAINT "ClienteInteracao_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClienteInteracao" ADD CONSTRAINT "ClienteInteracao_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClienteInteracao" ADD CONSTRAINT "ClienteInteracao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClienteInteracao" ADD CONSTRAINT "ClienteInteracao_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClienteDocumento" ADD CONSTRAINT "ClienteDocumento_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClienteDocumento" ADD CONSTRAINT "ClienteDocumento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClienteFavorito" ADD CONSTRAINT "ClienteFavorito_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClienteFavorito" ADD CONSTRAINT "ClienteFavorito_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClienteFavorito" ADD CONSTRAINT "ClienteFavorito_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClienteVisita" ADD CONSTRAINT "ClienteVisita_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClienteVisita" ADD CONSTRAINT "ClienteVisita_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClienteVisita" ADD CONSTRAINT "ClienteVisita_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClienteVisita" ADD CONSTRAINT "ClienteVisita_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClienteProposta" ADD CONSTRAINT "ClienteProposta_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClienteProposta" ADD CONSTRAINT "ClienteProposta_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClienteProposta" ADD CONSTRAINT "ClienteProposta_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClienteProposta" ADD CONSTRAINT "ClienteProposta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClienteHistorico" ADD CONSTRAINT "ClienteHistorico_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClienteHistorico" ADD CONSTRAINT "ClienteHistorico_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClienteHistorico" ADD CONSTRAINT "ClienteHistorico_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventoAgenda" ADD CONSTRAINT "EventoAgenda_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventoAgenda" ADD CONSTRAINT "EventoAgenda_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventoAgenda" ADD CONSTRAINT "EventoAgenda_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventoAgenda" ADD CONSTRAINT "EventoAgenda_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventoAgenda" ADD CONSTRAINT "EventoAgenda_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventoAgenda" ADD CONSTRAINT "EventoAgenda_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AgendaNotificacao" ADD CONSTRAINT "AgendaNotificacao_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AgendaNotificacao" ADD CONSTRAINT "AgendaNotificacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AgendaNotificacao" ADD CONSTRAINT "AgendaNotificacao_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "public"."EventoAgenda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tarefa" ADD CONSTRAINT "Tarefa_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tarefa" ADD CONSTRAINT "Tarefa_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "public"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tarefa" ADD CONSTRAINT "Tarefa_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tarefa" ADD CONSTRAINT "Tarefa_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tarefa" ADD CONSTRAINT "Tarefa_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Contrato" ADD CONSTRAINT "Contrato_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Contrato" ADD CONSTRAINT "Contrato_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Contrato" ADD CONSTRAINT "Contrato_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Contrato" ADD CONSTRAINT "Contrato_corretorId_fkey" FOREIGN KEY ("corretorId") REFERENCES "public"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CategoriaFinanceira" ADD CONSTRAINT "CategoriaFinanceira_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CentroCusto" ADD CONSTRAINT "CentroCusto_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LancamentoFinanceiro" ADD CONSTRAINT "LancamentoFinanceiro_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LancamentoFinanceiro" ADD CONSTRAINT "LancamentoFinanceiro_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "public"."CategoriaFinanceira"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LancamentoFinanceiro" ADD CONSTRAINT "LancamentoFinanceiro_centroCustoId_fkey" FOREIGN KEY ("centroCustoId") REFERENCES "public"."CentroCusto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LancamentoFinanceiro" ADD CONSTRAINT "LancamentoFinanceiro_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LancamentoFinanceiro" ADD CONSTRAINT "LancamentoFinanceiro_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "public"."Contrato"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LancamentoFinanceiro" ADD CONSTRAINT "LancamentoFinanceiro_corretorId_fkey" FOREIGN KEY ("corretorId") REFERENCES "public"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Cobranca" ADD CONSTRAINT "Cobranca_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Cobranca" ADD CONSTRAINT "Cobranca_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "public"."Contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Cobranca" ADD CONSTRAINT "Cobranca_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "public"."CategoriaFinanceira"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Cobranca" ADD CONSTRAINT "Cobranca_centroCustoId_fkey" FOREIGN KEY ("centroCustoId") REFERENCES "public"."CentroCusto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Cobranca" ADD CONSTRAINT "Cobranca_lancamentoId_fkey" FOREIGN KEY ("lancamentoId") REFERENCES "public"."LancamentoFinanceiro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comissao" ADD CONSTRAINT "Comissao_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comissao" ADD CONSTRAINT "Comissao_corretorId_fkey" FOREIGN KEY ("corretorId") REFERENCES "public"."Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comissao" ADD CONSTRAINT "Comissao_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "public"."Contrato"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comissao" ADD CONSTRAINT "Comissao_lancamentoId_fkey" FOREIGN KEY ("lancamentoId") REFERENCES "public"."LancamentoFinanceiro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comissao" ADD CONSTRAINT "Comissao_centroCustoId_fkey" FOREIGN KEY ("centroCustoId") REFERENCES "public"."CentroCusto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CaixaDiario" ADD CONSTRAINT "CaixaDiario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CaixaDiario" ADD CONSTRAINT "CaixaDiario_fechadoPorId_fkey" FOREIGN KEY ("fechadoPorId") REFERENCES "public"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MovimentoCaixa" ADD CONSTRAINT "MovimentoCaixa_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MovimentoCaixa" ADD CONSTRAINT "MovimentoCaixa_caixaDiarioId_fkey" FOREIGN KEY ("caixaDiarioId") REFERENCES "public"."CaixaDiario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MovimentoCaixa" ADD CONSTRAINT "MovimentoCaixa_lancamentoId_fkey" FOREIGN KEY ("lancamentoId") REFERENCES "public"."LancamentoFinanceiro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MovimentoCaixa" ADD CONSTRAINT "MovimentoCaixa_comissaoId_fkey" FOREIGN KEY ("comissaoId") REFERENCES "public"."Comissao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Conciliacao" ADD CONSTRAINT "Conciliacao_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Conciliacao" ADD CONSTRAINT "Conciliacao_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "public"."Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConciliacaoItem" ADD CONSTRAINT "ConciliacaoItem_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConciliacaoItem" ADD CONSTRAINT "ConciliacaoItem_conciliacaoId_fkey" FOREIGN KEY ("conciliacaoId") REFERENCES "public"."Conciliacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConciliacaoItem" ADD CONSTRAINT "ConciliacaoItem_lancamentoId_fkey" FOREIGN KEY ("lancamentoId") REFERENCES "public"."LancamentoFinanceiro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConciliacaoItem" ADD CONSTRAINT "ConciliacaoItem_movimentoCaixaId_fkey" FOREIGN KEY ("movimentoCaixaId") REFERENCES "public"."MovimentoCaixa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CorretorEquipe" ADD CONSTRAINT "CorretorEquipe_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CorretorHistorico" ADD CONSTRAINT "CorretorHistorico_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CorretorHistorico" ADD CONSTRAINT "CorretorHistorico_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CorretorHistorico" ADD CONSTRAINT "CorretorHistorico_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "public"."Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AppNotification" ADD CONSTRAINT "AppNotification_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AppNotification" ADD CONSTRAINT "AppNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Documento" ADD CONSTRAINT "Documento_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Documento" ADD CONSTRAINT "Documento_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "public"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IntegrationConfig" ADD CONSTRAINT "IntegrationConfig_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BackupRecord" ADD CONSTRAINT "BackupRecord_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
