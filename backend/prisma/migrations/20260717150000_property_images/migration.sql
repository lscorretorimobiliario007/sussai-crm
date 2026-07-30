-- CreateTable
CREATE TABLE "property_images" (
    "id" SERIAL NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "property_images_propertyId_order_idx" ON "property_images"("propertyId", "order");

-- CreateIndex
CREATE INDEX "property_images_propertyId_isCover_idx" ON "property_images"("propertyId", "isCover");

-- AddForeignKey
ALTER TABLE "property_images"
  ADD CONSTRAINT "property_images_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "properties"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
