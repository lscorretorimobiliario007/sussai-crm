-- Sprint 2: módulo completo de imóveis
CREATE TYPE "FinalidadeImovel" AS ENUM ('VENDA', 'LOCACAO', 'VENDA_E_LOCACAO');
CREATE TYPE "TipoImovel" AS ENUM (
    'APARTAMENTO', 'CASA', 'TERRENO', 'COMERCIAL', 'RURAL',
    'KITNET', 'SOBRADO', 'COBERTURA', 'GALPAO', 'SALA_COMERCIAL'
);
CREATE TYPE "AcaoHistoricoImovel" AS ENUM (
    'CRIADO', 'ATUALIZADO', 'DESATIVADO',
    'FOTO_ADICIONADA', 'FOTO_REMOVIDA', 'FOTO_PRINCIPAL'
);

ALTER TABLE "Imovel"
    ADD COLUMN "proprietarioId" INTEGER,
    ADD COLUMN "complemento" TEXT,
    ADD COLUMN "areaUtil" DOUBLE PRECISION,
    ADD COLUMN "caracteristicas" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "Imovel"
    ALTER COLUMN "finalidade" TYPE "FinalidadeImovel"
    USING (
        CASE LOWER("finalidade")
            WHEN 'venda' THEN 'VENDA'
            WHEN 'aluguel' THEN 'LOCACAO'
            WHEN 'locação' THEN 'LOCACAO'
            WHEN 'locacao' THEN 'LOCACAO'
            WHEN 'venda/aluguel' THEN 'VENDA_E_LOCACAO'
            WHEN 'venda e locação' THEN 'VENDA_E_LOCACAO'
            ELSE 'VENDA'
        END
    )::"FinalidadeImovel";

ALTER TABLE "Imovel"
    ALTER COLUMN "tipo" TYPE "TipoImovel"
    USING (
        CASE LOWER("tipo")
            WHEN 'apartamento' THEN 'APARTAMENTO'
            WHEN 'casa' THEN 'CASA'
            WHEN 'terreno' THEN 'TERRENO'
            WHEN 'comercial' THEN 'COMERCIAL'
            WHEN 'rural' THEN 'RURAL'
            WHEN 'kitnet' THEN 'KITNET'
            WHEN 'sobrado' THEN 'SOBRADO'
            WHEN 'cobertura' THEN 'COBERTURA'
            WHEN 'galpão' THEN 'GALPAO'
            WHEN 'galpao' THEN 'GALPAO'
            WHEN 'sala comercial' THEN 'SALA_COMERCIAL'
            ELSE 'CASA'
        END
    )::"TipoImovel";

CREATE TABLE "ImovelFoto" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "imovelId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ImovelFoto_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ImovelHistorico" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "imovelId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "acao" "AcaoHistoricoImovel" NOT NULL,
    "alteracoes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ImovelHistorico_pkey" PRIMARY KEY ("id")
);

INSERT INTO "ImovelFoto" (
    "empresaId", "imovelId", "url", "nomeArquivo", "mimeType",
    "tamanho", "ordem", "principal"
)
SELECT
    i."empresaId",
    i."id",
    imagem."url",
    'legacy-' || i."id" || '-' || imagem."ordem",
    'image/jpeg',
    0,
    imagem."ordem" - 1,
    imagem."ordem" = 1
FROM "Imovel" i
CROSS JOIN LATERAL unnest(COALESCE(i."imagens", ARRAY[]::TEXT[])) WITH ORDINALITY AS imagem("url", "ordem");

ALTER TABLE "Imovel" DROP COLUMN "imagens";

ALTER TABLE "Imovel"
    ADD CONSTRAINT "Imovel_proprietarioId_fkey"
    FOREIGN KEY ("proprietarioId") REFERENCES "Cliente"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ImovelFoto"
    ADD CONSTRAINT "ImovelFoto_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "ImovelFoto_imovelId_fkey"
    FOREIGN KEY ("imovelId") REFERENCES "Imovel"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ImovelHistorico"
    ADD CONSTRAINT "ImovelHistorico_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "ImovelHistorico_imovelId_fkey"
    FOREIGN KEY ("imovelId") REFERENCES "Imovel"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "ImovelHistorico_usuarioId_fkey"
    FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "Imovel_empresaId_ativo_createdAt_idx" ON "Imovel"("empresaId", "ativo", "createdAt");
CREATE INDEX "Imovel_empresaId_status_idx" ON "Imovel"("empresaId", "status");
CREATE INDEX "Imovel_empresaId_finalidade_idx" ON "Imovel"("empresaId", "finalidade");
CREATE INDEX "Imovel_empresaId_tipo_idx" ON "Imovel"("empresaId", "tipo");
CREATE INDEX "Imovel_empresaId_corretorId_idx" ON "Imovel"("empresaId", "corretorId");
CREATE INDEX "Imovel_empresaId_proprietarioId_idx" ON "Imovel"("empresaId", "proprietarioId");
CREATE UNIQUE INDEX "ImovelFoto_imovelId_ordem_key" ON "ImovelFoto"("imovelId", "ordem");
CREATE INDEX "ImovelFoto_empresaId_imovelId_ordem_idx" ON "ImovelFoto"("empresaId", "imovelId", "ordem");
CREATE INDEX "ImovelHistorico_empresaId_imovelId_createdAt_idx" ON "ImovelHistorico"("empresaId", "imovelId", "createdAt");
