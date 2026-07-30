-- CreateEnum
CREATE TYPE "UserProfile" AS ENUM ('ADMIN', 'GERENTE', 'CORRETOR');

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "perfil" "UserProfile" NOT NULL DEFAULT 'CORRETOR';

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Usuario_email_ativo_idx" ON "Usuario"("email", "ativo");
