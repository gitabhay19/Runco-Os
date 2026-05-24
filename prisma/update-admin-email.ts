import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.user.updateMany({
    where: { email: "admin@runcogrowth.com" },
    data: { email: "abhaykalera1@gmail.com" },
  });
  console.log(`Updated ${updated.count} admin row(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
