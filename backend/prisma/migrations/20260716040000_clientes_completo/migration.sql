-- Sprint 3: módulo completo de clientes
CREATE TYPE "TipoPessoa" AS ENUM ('PF', 'PJ');
CREATE TYPE "StatusCliente" AS ENUM ('PROSPECTO', 'QUALIFICADO', 'NEGOCIACAO', 'CLIENTE', 'INATIVO', 'PERDIDO');
CREATE TYPE "InteresseCliente" AS ENUM ('COMPRA', 'VENDA', 'LOCACAO', 'ADMINISTRACAO');
CREATE TYPE "AcaoHistoricoCliente" AS ENUM (
  'CRIADO', 'ATUALIZADO', 'DESATIVADO', 'REATIVADO', 'ANOTACAO', 'INTERACAO',
  'DOCUMENTO_ADICIONADO', 'DOCUMENTO_REMOVIDO', 'AVATAR_ATUALIZADO',
  'FAVORITO_ADICIONADO', 'FAVORITO_REMOVIDO', 'COMPARTILHADO',
  'VISITA_REGISTRADA', 'PROPOSTA_REGISTRADA'
);
CREATE TYPE "TipoContatoCliente" AS ENUM ('CELULAR', 'COMERCIAL', 'RESIDENCIAL', 'WHATSAPP', 'OUTRO');
CREATE TYPE "TipoEnderecoCliente" AS ENUM ('RESIDENCIAL', 'COMERCIAL', 'COBRANCA', 'OUTRO');
CREATE TYPE "TipoDocumentoCliente" AS ENUM ('CPF', 'CNPJ', 'RG', 'COMPROVANTE_RESIDENCIA', 'CONTRATO', 'OUTRO');
CREATE TYPE "TipoInteracaoCliente" AS ENUM ('LIGACAO', 'EMAIL', 'WHATSAPP', 'VISITA', 'REUNIAO', 'OUTRO');
CREATE TYPE "StatusVisitaCliente" AS ENUM ('AGENDADA', 'REALIZADA', 'CANCELADA', 'NAO_COMPARECEU');
CREATE TYPE "StatusPropostaCliente" AS ENUM ('RASCUNHO', 'ENVIADA', 'EM_ANALISE', 'ACEITA', 'RECUSADA', 'CANCELADA');

ALTER TABLE "Cliente"
  ADD COLUMN "corretorId" INTEGER,
  ADD COLUMN "tipoPessoa" "TipoPessoa" NOT NULL DEFAULT 'PF',
  ADD COLUMN "status" "StatusCliente" NOT NULL DEFAULT 'PROSPECTO',
  ADD COLUMN "razaoSocial" TEXT,
  ADD COLUMN "nomeFantasia" TEXT,
  ADD COLUMN "origem" TEXT,
  ADD COLUMN "interesses" "InteresseCliente"[] NOT NULL DEFAULT ARRAY[]::"InteresseCliente"[],
  ADD COLUMN "faixaPrecoMin" DOUBLE PRECISION,
  ADD COLUMN "faixaPrecoMax" DOUBLE PRECISION,
  ADD COLUMN "cidadesInteresse" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "avatarUrl" TEXT,
  ADD COLUMN "avatarArquivo" TEXT,
  ADD COLUMN "tokenCompartilhamento" TEXT;

CREATE UNIQUE INDEX "Cliente_tokenCompartilhamento_key" ON "Cliente"("tokenCompartilhamento");
CREATE INDEX "Cliente_empresaId_ativo_createdAt_idx" ON "Cliente"("empresaId", "ativo", "createdAt");
CREATE INDEX "Cliente_empresaId_tipo_idx" ON "Cliente"("empresaId", "tipo");
CREATE INDEX "Cliente_empresaId_status_idx" ON "Cliente"("empresaId", "status");
CREATE INDEX "Cliente_empresaId_corretorId_idx" ON "Cliente"("empresaId", "corretorId");
CREATE INDEX "Cliente_empresaId_cidade_idx" ON "Cliente"("empresaId", "cidade");

ALTER TABLE "Cliente"
  ADD CONSTRAINT "Cliente_corretorId_fkey"
  FOREIGN KEY ("corretorId") REFERENCES "Usuario"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ClienteTelefone" (
  "id" SERIAL PRIMARY KEY,
  "empresaId" INTEGER NOT NULL,
  "clienteId" INTEGER NOT NULL,
  "numero" TEXT NOT NULL,
  "tipo" "TipoContatoCliente" NOT NULL DEFAULT 'CELULAR',
  "principal" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ClienteEmail" (
  "id" SERIAL PRIMARY KEY,
  "empresaId" INTEGER NOT NULL,
  "clienteId" INTEGER NOT NULL,
  "email" TEXT NOT NULL,
  "tipo" "TipoContatoCliente" NOT NULL DEFAULT 'OUTRO',
  "principal" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ClienteEndereco" (
  "id" SERIAL PRIMARY KEY,
  "empresaId" INTEGER NOT NULL,
  "clienteId" INTEGER NOT NULL,
  "tipo" "TipoEnderecoCliente" NOT NULL DEFAULT 'RESIDENCIAL',
  "logradouro" TEXT NOT NULL,
  "numero" TEXT,
  "complemento" TEXT,
  "bairro" TEXT,
  "cidade" TEXT NOT NULL,
  "estado" TEXT NOT NULL,
  "cep" TEXT,
  "principal" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ClienteAnotacao" (
  "id" SERIAL PRIMARY KEY,
  "empresaId" INTEGER NOT NULL,
  "clienteId" INTEGER NOT NULL,
  "usuarioId" INTEGER NOT NULL,
  "conteudo" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ClienteInteracao" (
  "id" SERIAL PRIMARY KEY,
  "empresaId" INTEGER NOT NULL,
  "clienteId" INTEGER NOT NULL,
  "usuarioId" INTEGER NOT NULL,
  "imovelId" INTEGER,
  "tipo" "TipoInteracaoCliente" NOT NULL,
  "titulo" TEXT NOT NULL,
  "descricao" TEXT,
  "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ClienteHistorico" (
  "id" SERIAL PRIMARY KEY,
  "empresaId" INTEGER NOT NULL,
  "clienteId" INTEGER NOT NULL,
  "usuarioId" INTEGER NOT NULL,
  "acao" "AcaoHistoricoCliente" NOT NULL,
  "alteracoes" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ClienteDocumento" (
  "id" SERIAL PRIMARY KEY,
  "empresaId" INTEGER NOT NULL,
  "clienteId" INTEGER NOT NULL,
  "tipo" "TipoDocumentoCliente" NOT NULL DEFAULT 'OUTRO',
  "nome" TEXT NOT NULL,
  "nomeArquivo" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "tamanho" INTEGER NOT NULL,
  "url" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ClienteFavorito" (
  "id" SERIAL PRIMARY KEY,
  "empresaId" INTEGER NOT NULL,
  "clienteId" INTEGER NOT NULL,
  "imovelId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ClienteVisita" (
  "id" SERIAL PRIMARY KEY,
  "empresaId" INTEGER NOT NULL,
  "clienteId" INTEGER NOT NULL,
  "imovelId" INTEGER NOT NULL,
  "usuarioId" INTEGER NOT NULL,
  "dataHora" TIMESTAMP(3) NOT NULL,
  "status" "StatusVisitaCliente" NOT NULL DEFAULT 'AGENDADA',
  "observacoes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ClienteProposta" (
  "id" SERIAL PRIMARY KEY,
  "empresaId" INTEGER NOT NULL,
  "clienteId" INTEGER NOT NULL,
  "imovelId" INTEGER NOT NULL,
  "usuarioId" INTEGER NOT NULL,
  "valor" DOUBLE PRECISION NOT NULL,
  "status" "StatusPropostaCliente" NOT NULL DEFAULT 'RASCUNHO',
  "observacoes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "ClienteTelefone"
  ADD CONSTRAINT "ClienteTelefone_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "ClienteTelefone_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClienteEmail"
  ADD CONSTRAINT "ClienteEmail_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "ClienteEmail_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClienteEndereco"
  ADD CONSTRAINT "ClienteEndereco_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "ClienteEndereco_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClienteAnotacao"
  ADD CONSTRAINT "ClienteAnotacao_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "ClienteAnotacao_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "ClienteAnotacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ClienteInteracao"
  ADD CONSTRAINT "ClienteInteracao_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "ClienteInteracao_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "ClienteInteracao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "ClienteInteracao_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "Imovel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ClienteHistorico"
  ADD CONSTRAINT "ClienteHistorico_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "ClienteHistorico_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "ClienteHistorico_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ClienteDocumento"
  ADD CONSTRAINT "ClienteDocumento_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "ClienteDocumento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClienteFavorito"
  ADD CONSTRAINT "ClienteFavorito_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "ClienteFavorito_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "ClienteFavorito_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "Imovel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClienteVisita"
  ADD CONSTRAINT "ClienteVisita_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "ClienteVisita_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "ClienteVisita_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "Imovel"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "ClienteVisita_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ClienteProposta"
  ADD CONSTRAINT "ClienteProposta_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "ClienteProposta_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "ClienteProposta_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "Imovel"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "ClienteProposta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "ClienteTelefone_empresaId_clienteId_idx" ON "ClienteTelefone"("empresaId", "clienteId");
CREATE INDEX "ClienteEmail_empresaId_clienteId_idx" ON "ClienteEmail"("empresaId", "clienteId");
CREATE INDEX "ClienteEndereco_empresaId_clienteId_idx" ON "ClienteEndereco"("empresaId", "clienteId");
CREATE INDEX "ClienteAnotacao_empresaId_clienteId_createdAt_idx" ON "ClienteAnotacao"("empresaId", "clienteId", "createdAt");
CREATE INDEX "ClienteInteracao_empresaId_clienteId_dataHora_idx" ON "ClienteInteracao"("empresaId", "clienteId", "dataHora");
CREATE INDEX "ClienteHistorico_empresaId_clienteId_createdAt_idx" ON "ClienteHistorico"("empresaId", "clienteId", "createdAt");
CREATE INDEX "ClienteDocumento_empresaId_clienteId_idx" ON "ClienteDocumento"("empresaId", "clienteId");
CREATE UNIQUE INDEX "ClienteFavorito_clienteId_imovelId_key" ON "ClienteFavorito"("clienteId", "imovelId");
CREATE INDEX "ClienteFavorito_empresaId_clienteId_idx" ON "ClienteFavorito"("empresaId", "clienteId");
CREATE INDEX "ClienteVisita_empresaId_clienteId_dataHora_idx" ON "ClienteVisita"("empresaId", "clienteId", "dataHora");
CREATE INDEX "ClienteVisita_empresaId_imovelId_idx" ON "ClienteVisita"("empresaId", "imovelId");
CREATE INDEX "ClienteProposta_empresaId_clienteId_createdAt_idx" ON "ClienteProposta"("empresaId", "clienteId", "createdAt");
CREATE INDEX "ClienteProposta_empresaId_imovelId_idx" ON "ClienteProposta"("empresaId", "imovelId");
