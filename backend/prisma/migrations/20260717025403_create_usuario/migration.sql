/*
  Warnings:

  - You are about to drop the column `comissaoPadrao` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `crea` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `creci` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `empresaId` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `equipeId` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `fotoArquivo` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `fotoUrl` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `metaMensal` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `permissoes` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `statusCorretor` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `telefone` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `tipo` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the `AgendaHistorico` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AgendaNotificacao` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CaixaDiario` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CategoriaFinanceira` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CentroCusto` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Cliente` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ClienteAnotacao` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ClienteDadosBancarios` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ClienteDocumento` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ClienteEmail` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ClienteEndereco` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ClienteFavorito` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ClienteHistorico` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ClienteInteracao` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ClienteProposta` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ClienteTelefone` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ClienteVisita` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Cobranca` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Comissao` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Conciliacao` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ConciliacaoItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Contrato` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CorretorEquipe` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CorretorHistorico` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Empresa` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EventoAgenda` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Imovel` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ImovelChaveHistorico` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ImovelFoto` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ImovelHistorico` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LancamentoFinanceiro` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Lead` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LeadAnexo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LeadComentario` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LeadHistorico` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MovimentoCaixa` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PipelineEtapa` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Tarefa` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."AgendaHistorico" DROP CONSTRAINT "AgendaHistorico_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."AgendaHistorico" DROP CONSTRAINT "AgendaHistorico_eventoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."AgendaHistorico" DROP CONSTRAINT "AgendaHistorico_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "public"."AgendaNotificacao" DROP CONSTRAINT "AgendaNotificacao_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."AgendaNotificacao" DROP CONSTRAINT "AgendaNotificacao_eventoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."AgendaNotificacao" DROP CONSTRAINT "AgendaNotificacao_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CaixaDiario" DROP CONSTRAINT "CaixaDiario_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CaixaDiario" DROP CONSTRAINT "CaixaDiario_fechadoPorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CategoriaFinanceira" DROP CONSTRAINT "CategoriaFinanceira_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CentroCusto" DROP CONSTRAINT "CentroCusto_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Cliente" DROP CONSTRAINT "Cliente_corretorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Cliente" DROP CONSTRAINT "Cliente_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClienteAnotacao" DROP CONSTRAINT "ClienteAnotacao_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClienteAnotacao" DROP CONSTRAINT "ClienteAnotacao_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClienteAnotacao" DROP CONSTRAINT "ClienteAnotacao_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClienteDadosBancarios" DROP CONSTRAINT "ClienteDadosBancarios_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClienteDadosBancarios" DROP CONSTRAINT "ClienteDadosBancarios_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClienteDocumento" DROP CONSTRAINT "ClienteDocumento_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClienteDocumento" DROP CONSTRAINT "ClienteDocumento_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClienteEmail" DROP CONSTRAINT "ClienteEmail_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClienteEmail" DROP CONSTRAINT "ClienteEmail_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClienteEndereco" DROP CONSTRAINT "ClienteEndereco_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClienteEndereco" DROP CONSTRAINT "ClienteEndereco_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClienteFavorito" DROP CONSTRAINT "ClienteFavorito_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClienteFavorito" DROP CONSTRAINT "ClienteFavorito_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClienteFavorito" DROP CONSTRAINT "ClienteFavorito_imovelId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClienteHistorico" DROP CONSTRAINT "ClienteHistorico_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClienteHistorico" DROP CONSTRAINT "ClienteHistorico_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClienteHistorico" DROP CONSTRAINT "ClienteHistorico_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClienteInteracao" DROP CONSTRAINT "ClienteInteracao_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClienteInteracao" DROP CONSTRAINT "ClienteInteracao_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClienteInteracao" DROP CONSTRAINT "ClienteInteracao_imovelId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClienteInteracao" DROP CONSTRAINT "ClienteInteracao_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClienteProposta" DROP CONSTRAINT "ClienteProposta_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClienteProposta" DROP CONSTRAINT "ClienteProposta_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClienteProposta" DROP CONSTRAINT "ClienteProposta_imovelId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClienteProposta" DROP CONSTRAINT "ClienteProposta_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClienteTelefone" DROP CONSTRAINT "ClienteTelefone_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClienteTelefone" DROP CONSTRAINT "ClienteTelefone_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClienteVisita" DROP CONSTRAINT "ClienteVisita_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClienteVisita" DROP CONSTRAINT "ClienteVisita_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClienteVisita" DROP CONSTRAINT "ClienteVisita_imovelId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClienteVisita" DROP CONSTRAINT "ClienteVisita_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Cobranca" DROP CONSTRAINT "Cobranca_categoriaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Cobranca" DROP CONSTRAINT "Cobranca_centroCustoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Cobranca" DROP CONSTRAINT "Cobranca_contratoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Cobranca" DROP CONSTRAINT "Cobranca_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Cobranca" DROP CONSTRAINT "Cobranca_lancamentoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Comissao" DROP CONSTRAINT "Comissao_centroCustoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Comissao" DROP CONSTRAINT "Comissao_contratoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Comissao" DROP CONSTRAINT "Comissao_corretorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Comissao" DROP CONSTRAINT "Comissao_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Comissao" DROP CONSTRAINT "Comissao_lancamentoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Conciliacao" DROP CONSTRAINT "Conciliacao_criadoPorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Conciliacao" DROP CONSTRAINT "Conciliacao_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ConciliacaoItem" DROP CONSTRAINT "ConciliacaoItem_conciliacaoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ConciliacaoItem" DROP CONSTRAINT "ConciliacaoItem_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ConciliacaoItem" DROP CONSTRAINT "ConciliacaoItem_lancamentoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ConciliacaoItem" DROP CONSTRAINT "ConciliacaoItem_movimentoCaixaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Contrato" DROP CONSTRAINT "Contrato_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Contrato" DROP CONSTRAINT "Contrato_corretorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Contrato" DROP CONSTRAINT "Contrato_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Contrato" DROP CONSTRAINT "Contrato_imovelId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Contrato" DROP CONSTRAINT "Contrato_proprietarioId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CorretorEquipe" DROP CONSTRAINT "CorretorEquipe_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CorretorHistorico" DROP CONSTRAINT "CorretorHistorico_autorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CorretorHistorico" DROP CONSTRAINT "CorretorHistorico_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CorretorHistorico" DROP CONSTRAINT "CorretorHistorico_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "public"."EventoAgenda" DROP CONSTRAINT "EventoAgenda_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."EventoAgenda" DROP CONSTRAINT "EventoAgenda_criadoPorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."EventoAgenda" DROP CONSTRAINT "EventoAgenda_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."EventoAgenda" DROP CONSTRAINT "EventoAgenda_eventoPaiId_fkey";

-- DropForeignKey
ALTER TABLE "public"."EventoAgenda" DROP CONSTRAINT "EventoAgenda_imovelId_fkey";

-- DropForeignKey
ALTER TABLE "public"."EventoAgenda" DROP CONSTRAINT "EventoAgenda_leadId_fkey";

-- DropForeignKey
ALTER TABLE "public"."EventoAgenda" DROP CONSTRAINT "EventoAgenda_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Imovel" DROP CONSTRAINT "Imovel_angariadorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Imovel" DROP CONSTRAINT "Imovel_corretorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Imovel" DROP CONSTRAINT "Imovel_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Imovel" DROP CONSTRAINT "Imovel_proprietarioId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ImovelChaveHistorico" DROP CONSTRAINT "ImovelChaveHistorico_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ImovelChaveHistorico" DROP CONSTRAINT "ImovelChaveHistorico_imovelId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ImovelChaveHistorico" DROP CONSTRAINT "ImovelChaveHistorico_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ImovelFoto" DROP CONSTRAINT "ImovelFoto_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ImovelFoto" DROP CONSTRAINT "ImovelFoto_imovelId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ImovelHistorico" DROP CONSTRAINT "ImovelHistorico_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ImovelHistorico" DROP CONSTRAINT "ImovelHistorico_imovelId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ImovelHistorico" DROP CONSTRAINT "ImovelHistorico_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "public"."LancamentoFinanceiro" DROP CONSTRAINT "LancamentoFinanceiro_categoriaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."LancamentoFinanceiro" DROP CONSTRAINT "LancamentoFinanceiro_centroCustoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."LancamentoFinanceiro" DROP CONSTRAINT "LancamentoFinanceiro_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."LancamentoFinanceiro" DROP CONSTRAINT "LancamentoFinanceiro_contratoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."LancamentoFinanceiro" DROP CONSTRAINT "LancamentoFinanceiro_corretorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."LancamentoFinanceiro" DROP CONSTRAINT "LancamentoFinanceiro_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Lead" DROP CONSTRAINT "Lead_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Lead" DROP CONSTRAINT "Lead_corretorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Lead" DROP CONSTRAINT "Lead_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Lead" DROP CONSTRAINT "Lead_etapaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Lead" DROP CONSTRAINT "Lead_imovelId_fkey";

-- DropForeignKey
ALTER TABLE "public"."LeadAnexo" DROP CONSTRAINT "LeadAnexo_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."LeadAnexo" DROP CONSTRAINT "LeadAnexo_leadId_fkey";

-- DropForeignKey
ALTER TABLE "public"."LeadComentario" DROP CONSTRAINT "LeadComentario_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."LeadComentario" DROP CONSTRAINT "LeadComentario_leadId_fkey";

-- DropForeignKey
ALTER TABLE "public"."LeadComentario" DROP CONSTRAINT "LeadComentario_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "public"."LeadHistorico" DROP CONSTRAINT "LeadHistorico_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."LeadHistorico" DROP CONSTRAINT "LeadHistorico_leadId_fkey";

-- DropForeignKey
ALTER TABLE "public"."LeadHistorico" DROP CONSTRAINT "LeadHistorico_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "public"."MovimentoCaixa" DROP CONSTRAINT "MovimentoCaixa_caixaDiarioId_fkey";

-- DropForeignKey
ALTER TABLE "public"."MovimentoCaixa" DROP CONSTRAINT "MovimentoCaixa_comissaoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."MovimentoCaixa" DROP CONSTRAINT "MovimentoCaixa_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."MovimentoCaixa" DROP CONSTRAINT "MovimentoCaixa_lancamentoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PipelineEtapa" DROP CONSTRAINT "PipelineEtapa_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Tarefa" DROP CONSTRAINT "Tarefa_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Tarefa" DROP CONSTRAINT "Tarefa_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Tarefa" DROP CONSTRAINT "Tarefa_leadId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Tarefa" DROP CONSTRAINT "Tarefa_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Usuario" DROP CONSTRAINT "Usuario_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Usuario" DROP CONSTRAINT "Usuario_equipeId_fkey";

-- DropIndex
DROP INDEX "public"."Usuario_empresaId_ativo_idx";

-- DropIndex
DROP INDEX "public"."Usuario_empresaId_equipeId_idx";

-- DropIndex
DROP INDEX "public"."Usuario_empresaId_statusCorretor_idx";

-- AlterTable
ALTER TABLE "public"."Usuario" DROP COLUMN "comissaoPadrao",
DROP COLUMN "crea",
DROP COLUMN "creci",
DROP COLUMN "empresaId",
DROP COLUMN "equipeId",
DROP COLUMN "fotoArquivo",
DROP COLUMN "fotoUrl",
DROP COLUMN "metaMensal",
DROP COLUMN "permissoes",
DROP COLUMN "statusCorretor",
DROP COLUMN "telefone",
DROP COLUMN "tipo";

-- DropTable
DROP TABLE "public"."AgendaHistorico";

-- DropTable
DROP TABLE "public"."AgendaNotificacao";

-- DropTable
DROP TABLE "public"."CaixaDiario";

-- DropTable
DROP TABLE "public"."CategoriaFinanceira";

-- DropTable
DROP TABLE "public"."CentroCusto";

-- DropTable
DROP TABLE "public"."Cliente";

-- DropTable
DROP TABLE "public"."ClienteAnotacao";

-- DropTable
DROP TABLE "public"."ClienteDadosBancarios";

-- DropTable
DROP TABLE "public"."ClienteDocumento";

-- DropTable
DROP TABLE "public"."ClienteEmail";

-- DropTable
DROP TABLE "public"."ClienteEndereco";

-- DropTable
DROP TABLE "public"."ClienteFavorito";

-- DropTable
DROP TABLE "public"."ClienteHistorico";

-- DropTable
DROP TABLE "public"."ClienteInteracao";

-- DropTable
DROP TABLE "public"."ClienteProposta";

-- DropTable
DROP TABLE "public"."ClienteTelefone";

-- DropTable
DROP TABLE "public"."ClienteVisita";

-- DropTable
DROP TABLE "public"."Cobranca";

-- DropTable
DROP TABLE "public"."Comissao";

-- DropTable
DROP TABLE "public"."Conciliacao";

-- DropTable
DROP TABLE "public"."ConciliacaoItem";

-- DropTable
DROP TABLE "public"."Contrato";

-- DropTable
DROP TABLE "public"."CorretorEquipe";

-- DropTable
DROP TABLE "public"."CorretorHistorico";

-- DropTable
DROP TABLE "public"."Empresa";

-- DropTable
DROP TABLE "public"."EventoAgenda";

-- DropTable
DROP TABLE "public"."Imovel";

-- DropTable
DROP TABLE "public"."ImovelChaveHistorico";

-- DropTable
DROP TABLE "public"."ImovelFoto";

-- DropTable
DROP TABLE "public"."ImovelHistorico";

-- DropTable
DROP TABLE "public"."LancamentoFinanceiro";

-- DropTable
DROP TABLE "public"."Lead";

-- DropTable
DROP TABLE "public"."LeadAnexo";

-- DropTable
DROP TABLE "public"."LeadComentario";

-- DropTable
DROP TABLE "public"."LeadHistorico";

-- DropTable
DROP TABLE "public"."MovimentoCaixa";

-- DropTable
DROP TABLE "public"."PipelineEtapa";

-- DropTable
DROP TABLE "public"."Tarefa";

-- DropEnum
DROP TYPE "public"."AcaoChaveImovel";

-- DropEnum
DROP TYPE "public"."AcaoHistoricoAgenda";

-- DropEnum
DROP TYPE "public"."AcaoHistoricoCliente";

-- DropEnum
DROP TYPE "public"."AcaoHistoricoCorretor";

-- DropEnum
DROP TYPE "public"."AcaoHistoricoImovel";

-- DropEnum
DROP TYPE "public"."AcaoHistoricoLead";

-- DropEnum
DROP TYPE "public"."FinalidadeImovel";

-- DropEnum
DROP TYPE "public"."FormaPagamentoFinanceiro";

-- DropEnum
DROP TYPE "public"."FrequenciaRepeticaoAgenda";

-- DropEnum
DROP TYPE "public"."InteresseCliente";

-- DropEnum
DROP TYPE "public"."OcupacaoImovel";

-- DropEnum
DROP TYPE "public"."OrigemCaptacaoImovel";

-- DropEnum
DROP TYPE "public"."PlanoEmpresa";

-- DropEnum
DROP TYPE "public"."PrioridadeTarefa";

-- DropEnum
DROP TYPE "public"."SituacaoCaptacaoImovel";

-- DropEnum
DROP TYPE "public"."StatusCaixaDiario";

-- DropEnum
DROP TYPE "public"."StatusCliente";

-- DropEnum
DROP TYPE "public"."StatusCobranca";

-- DropEnum
DROP TYPE "public"."StatusComissao";

-- DropEnum
DROP TYPE "public"."StatusConciliacao";

-- DropEnum
DROP TYPE "public"."StatusContrato";

-- DropEnum
DROP TYPE "public"."StatusCorretor";

-- DropEnum
DROP TYPE "public"."StatusEventoAgenda";

-- DropEnum
DROP TYPE "public"."StatusImovel";

-- DropEnum
DROP TYPE "public"."StatusLancamentoFinanceiro";

-- DropEnum
DROP TYPE "public"."StatusLead";

-- DropEnum
DROP TYPE "public"."StatusPropostaCliente";

-- DropEnum
DROP TYPE "public"."StatusTarefa";

-- DropEnum
DROP TYPE "public"."StatusVisitaCliente";

-- DropEnum
DROP TYPE "public"."TipoCategoriaFinanceira";

-- DropEnum
DROP TYPE "public"."TipoCliente";

-- DropEnum
DROP TYPE "public"."TipoContaBancaria";

-- DropEnum
DROP TYPE "public"."TipoContatoCliente";

-- DropEnum
DROP TYPE "public"."TipoContrato";

-- DropEnum
DROP TYPE "public"."TipoDocumentoCliente";

-- DropEnum
DROP TYPE "public"."TipoEnderecoCliente";

-- DropEnum
DROP TYPE "public"."TipoEtapaPipeline";

-- DropEnum
DROP TYPE "public"."TipoEventoAgenda";

-- DropEnum
DROP TYPE "public"."TipoImovel";

-- DropEnum
DROP TYPE "public"."TipoInteracaoCliente";

-- DropEnum
DROP TYPE "public"."TipoLancamentoFinanceiro";

-- DropEnum
DROP TYPE "public"."TipoMovimentoCaixa";

-- DropEnum
DROP TYPE "public"."TipoPessoa";

-- DropEnum
DROP TYPE "public"."TipoUsuario";

-- CreateTable
CREATE TABLE "public"."Teste" (
    "id" SERIAL NOT NULL,

    CONSTRAINT "Teste_pkey" PRIMARY KEY ("id")
);
