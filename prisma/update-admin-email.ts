import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL } },
});

async function main() {
  // Update from old email to new one (handles both possible old values)
  const r1 = await prisma.user.updateMany({
    where: { email: "abhaykalera1@gmail.com" },
    data: { email: "abhay@runcogrowth.com" },
  });
  const r2 = await prisma.user.updateMany({
    where: { email: "admin@runcogrowth.com" },
    data: { email: "abhay@runcogrowth.com" },
  });
  console.log(`Updated ${r1.count + r2.count} admin row(s) → abhay@runcogrowth.com`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
