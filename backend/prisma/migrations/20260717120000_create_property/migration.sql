-- CreateEnum
CREATE TYPE "PropertyPurpose" AS ENUM ('SALE', 'RENT', 'SALE_AND_RENT');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('APARTMENT', 'HOUSE', 'LAND', 'COMMERCIAL', 'RURAL', 'STUDIO', 'TOWNHOUSE', 'PENTHOUSE', 'WAREHOUSE', 'OFFICE');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD', 'RENTED', 'INACTIVE');

-- CreateTable
CREATE TABLE IF NOT EXISTS "properties" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "purpose" "PropertyPurpose" NOT NULL,
    "type" "PropertyType" NOT NULL,
    "status" "PropertyStatus" NOT NULL DEFAULT 'AVAILABLE',
    "salePrice" DOUBLE PRECISION,
    "rentPrice" DOUBLE PRECISION,
    "address" TEXT NOT NULL,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" CHAR(2) NOT NULL,
    "zipCode" TEXT,
    "bedrooms" INTEGER NOT NULL DEFAULT 0,
    "suites" INTEGER NOT NULL DEFAULT 0,
    "bathrooms" INTEGER NOT NULL DEFAULT 0,
    "parkingSpots" INTEGER NOT NULL DEFAULT 0,
    "landArea" DOUBLE PRECISION,
    "builtArea" DOUBLE PRECISION,
    "usefulArea" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "properties_companyId_code_key" ON "properties"("companyId", "code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "properties_companyId_active_status_idx" ON "properties"("companyId", "active", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "properties_companyId_purpose_idx" ON "properties"("companyId", "purpose");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "properties_companyId_type_idx" ON "properties"("companyId", "type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "properties_companyId_city_idx" ON "properties"("companyId", "city");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "properties_companyId_published_active_idx" ON "properties"("companyId", "published", "active");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Usuario_empresaId_idx" ON "Usuario"("empresaId");

-- AddForeignKey
DO $$
BEGIN
  ALTER TABLE "properties" ADD CONSTRAINT "properties_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
