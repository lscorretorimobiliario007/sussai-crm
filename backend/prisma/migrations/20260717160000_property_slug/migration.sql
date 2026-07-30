-- AlterTable
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "slug" TEXT;

-- Backfill slug for existing rows
UPDATE "properties"
SET "slug" = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(COALESCE("titulo", "codigo"), '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'))
WHERE "slug" IS NULL OR "slug" = '';

-- Ensure uniqueness by appending id when needed (simple pass)
UPDATE "properties" p
SET "slug" = p."slug" || '-' || p."id"::text
WHERE EXISTS (
  SELECT 1
  FROM "properties" other
  WHERE other."empresaId" = p."empresaId"
    AND other."slug" = p."slug"
    AND other."id" < p."id"
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "properties_empresaId_slug_key" ON "properties"("empresaId", "slug");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "properties_empresaId_destaque_createdAt_idx" ON "properties"("empresaId", "destaque", "createdAt");
