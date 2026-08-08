import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const removed = await prisma.$executeRaw`
    DELETE FROM "_prisma_migrations"
    WHERE migration_name = '20260807020000_empresa_branding_fields'
      AND finished_at IS NULL
  `;
  console.log("Removed unfinished duplicate migration rows:", removed);

  const rows = await prisma.$queryRaw`
    SELECT migration_name, finished_at
    FROM "_prisma_migrations"
    WHERE migration_name = '20260807020000_empresa_branding_fields'
  `;
  console.log(rows);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
