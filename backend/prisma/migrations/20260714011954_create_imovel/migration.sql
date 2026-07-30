-- CreateTable
CREATE TABLE "Imovel" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "finalidade" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "valorVenda" DOUBLE PRECISION,
    "valorAluguel" DOUBLE PRECISION,
    "endereco" TEXT NOT NULL,
    "numero" TEXT,
    "bairro" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "cep" TEXT,
    "quartos" INTEGER NOT NULL DEFAULT 0,
    "suites" INTEGER NOT NULL DEFAULT 0,
    "banheiros" INTEGER NOT NULL DEFAULT 0,
    "vagas" INTEGER NOT NULL DEFAULT 0,
    "areaTerreno" DOUBLE PRECISION,
    "areaConstruida" DOUBLE PRECISION,
    "piscina" BOOLEAN NOT NULL DEFAULT false,
    "churrasqueira" BOOLEAN NOT NULL DEFAULT false,
    "iptu" DOUBLE PRECISION,
    "condominio" DOUBLE PRECISION,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Imovel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Imovel_codigo_key" ON "Imovel"("codigo");
