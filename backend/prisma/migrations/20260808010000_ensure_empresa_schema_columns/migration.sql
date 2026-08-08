-- Idempotent repair: ensure Empresa matches schema.prisma
-- Root cause: 20260717031941_create_empresa recreated Empresa without
-- nomeFantasia/ativo; later 20260807013943 adds them but may be pending
-- or partially failed on VPS. This migration is safe to re-run.

DO $$ BEGIN
  CREATE TYPE "public"."PlanoEmpresa" AS ENUM ('STARTER', 'PROFESSIONAL', 'ENTERPRISE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "public"."Empresa" ADD COLUMN IF NOT EXISTS "nomeFantasia" TEXT;
ALTER TABLE "public"."Empresa" ADD COLUMN IF NOT EXISTS "razaoSocial" TEXT;
ALTER TABLE "public"."Empresa" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
ALTER TABLE "public"."Empresa" ADD COLUMN IF NOT EXISTS "faviconUrl" TEXT;
ALTER TABLE "public"."Empresa" ADD COLUMN IF NOT EXISTS "siteUrl" TEXT;
ALTER TABLE "public"."Empresa" ADD COLUMN IF NOT EXISTS "creci" TEXT;
ALTER TABLE "public"."Empresa" ADD COLUMN IF NOT EXISTS "slogan" TEXT;
ALTER TABLE "public"."Empresa" ADD COLUMN IF NOT EXISTS "corPrimaria" TEXT DEFAULT '#0B1F3A';
ALTER TABLE "public"."Empresa" ADD COLUMN IF NOT EXISTS "corSecundaria" TEXT DEFAULT '#C9A227';
ALTER TABLE "public"."Empresa" ADD COLUMN IF NOT EXISTS "endereco" TEXT;
ALTER TABLE "public"."Empresa" ADD COLUMN IF NOT EXISTS "numero" TEXT;
ALTER TABLE "public"."Empresa" ADD COLUMN IF NOT EXISTS "complemento" TEXT;
ALTER TABLE "public"."Empresa" ADD COLUMN IF NOT EXISTS "bairro" TEXT;
ALTER TABLE "public"."Empresa" ADD COLUMN IF NOT EXISTS "cidade" TEXT;
ALTER TABLE "public"."Empresa" ADD COLUMN IF NOT EXISTS "estado" TEXT;
ALTER TABLE "public"."Empresa" ADD COLUMN IF NOT EXISTS "cep" TEXT;
ALTER TABLE "public"."Empresa" ADD COLUMN IF NOT EXISTS "whatsapp" TEXT;
ALTER TABLE "public"."Empresa" ADD COLUMN IF NOT EXISTS "instagram" TEXT;
ALTER TABLE "public"."Empresa" ADD COLUMN IF NOT EXISTS "facebook" TEXT;
ALTER TABLE "public"."Empresa" ADD COLUMN IF NOT EXISTS "linkedin" TEXT;
ALTER TABLE "public"."Empresa" ADD COLUMN IF NOT EXISTS "youtube" TEXT;
ALTER TABLE "public"."Empresa" ADD COLUMN IF NOT EXISTS "horarioAtendimento" TEXT;
ALTER TABLE "public"."Empresa" ADD COLUMN IF NOT EXISTS "googleMapsUrl" TEXT;
ALTER TABLE "public"."Empresa" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
ALTER TABLE "public"."Empresa" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;
ALTER TABLE "public"."Empresa" ADD COLUMN IF NOT EXISTS "siteTitulo" TEXT;
ALTER TABLE "public"."Empresa" ADD COLUMN IF NOT EXISTS "siteDescricao" TEXT;
ALTER TABLE "public"."Empresa" ADD COLUMN IF NOT EXISTS "seoKeywords" TEXT;

ALTER TABLE "public"."Empresa" ADD COLUMN IF NOT EXISTS "siteAtivo" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "public"."Empresa" ADD COLUMN IF NOT EXISTS "siteExibirCorretores" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "public"."Empresa" ADD COLUMN IF NOT EXISTS "siteExibirBlog" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "public"."Empresa" ADD COLUMN IF NOT EXISTS "ativo" BOOLEAN NOT NULL DEFAULT true;

-- plano: add if missing (enum type ensured above)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Empresa' AND column_name = 'plano'
  ) THEN
    ALTER TABLE "public"."Empresa"
      ADD COLUMN "plano" "public"."PlanoEmpresa" NOT NULL DEFAULT 'STARTER';
  END IF;
END $$;
