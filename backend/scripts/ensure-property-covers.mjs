/**
 * Garante capa em todos os imóveis publicados sem foto.
 * Copia arquivos de um imóvel doador (padrão: id 1) e registra PropertyImage.
 *
 * Uso: node scripts/ensure-property-covers.mjs
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const UPLOADS = join(process.cwd(), 'uploads');
const DONOR_ID = Number(process.env.COVER_DONOR_PROPERTY_ID || 1);

async function main() {
  const donorImages = await prisma.propertyImage.findMany({
    where: { propertyId: DONOR_ID },
    orderBy: [{ isCover: 'desc' }, { order: 'asc' }, { id: 'asc' }],
  });

  if (donorImages.length === 0) {
    throw new Error(
      `Imóvel doador #${DONOR_ID} não tem fotos. Cadastre ao menos uma capa antes.`,
    );
  }

  const donorFiles = donorImages
    .map((img) => ({
      ...img,
      abs: join(UPLOADS, img.filePath.replace(/^\/+/, '')),
    }))
    .filter((img) => existsSync(img.abs));

  if (donorFiles.length === 0) {
    throw new Error('Arquivos físicos do doador não encontrados em uploads/');
  }

  const properties = await prisma.property.findMany({
    where: { ativo: true, publicado: true },
    include: { images: true },
    orderBy: { id: 'asc' },
  });

  let attached = 0;

  for (const property of properties) {
    if (property.images.length > 0) continue;

    const destDir = join(UPLOADS, 'properties', String(property.id));
    mkdirSync(destDir, { recursive: true });

    // 1 capa + até 2 extras para galeria
    const take = donorFiles.slice(0, Math.min(3, donorFiles.length));
    let order = 0;
    for (const src of take) {
      const ext = extname(src.fileName) || '.png';
      const fileName = `${randomUUID()}${ext}`;
      const relPath = `properties/${property.id}/${fileName}`;
      const destAbs = join(UPLOADS, relPath);
      copyFileSync(src.abs, destAbs);
      const size = statSync(destAbs).size;

      await prisma.propertyImage.create({
        data: {
          propertyId: property.id,
          fileName,
          filePath: relPath,
          mimeType: src.mimeType || 'image/png',
          size,
          order,
          isCover: order === 0,
        },
      });
      order += 1;
    }

    attached += 1;
    console.log(
      `✓ Capa anexada ao imóvel #${property.id} (${property.codigo}) — ${take.length} foto(s)`,
    );
  }

  // Lista final
  const check = await prisma.property.findMany({
    where: { ativo: true, publicado: true },
    include: { images: { orderBy: [{ isCover: 'desc' }, { order: 'asc' }] } },
    orderBy: { id: 'asc' },
  });

  const missing = check.filter((p) => p.images.length === 0);
  console.log(`\nPublicados: ${check.length}`);
  console.log(`Com foto: ${check.length - missing.length}`);
  console.log(`Sem foto: ${missing.length}`);
  console.log(`Anexados nesta execução: ${attached}`);

  if (missing.length > 0) {
    console.error(
      'Ainda sem foto:',
      missing.map((p) => p.codigo).join(', '),
    );
    process.exitCode = 1;
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
