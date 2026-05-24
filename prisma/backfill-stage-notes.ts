import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const deals = await prisma.deal.findMany({ select: { id: true, stageId: true } });
  for (const d of deals) {
    await prisma.stageNote.upsert({
      where: { dealId_stageId: { dealId: d.id, stageId: d.stageId } },
      update: {},
      create: { dealId: d.id, stageId: d.stageId },
    });
  }
  console.log(`Backfilled stage notes for ${deals.length} deals.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
