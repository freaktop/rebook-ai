import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const business = await prisma.business.upsert({
    where: { slug: "demo-business" },
    update: {},
    create: {
      name: "Demo Business",
      slug: "demo-business",
      bookingUrl: "https://example.com/book",
      reminderInterval: 21,
      contactEmail: "hello@example.com",
    },
  });

  await prisma.reminderConfig.upsert({
    where: { businessId: business.id },
    update: {},
    create: { businessId: business.id, intervalDays: 21 },
  });

  const passwordHash = await bcrypt.hash("demo1234", 10);
  await prisma.businessAdmin.upsert({
    where: { email: "admin@rebook.ai" },
    update: {},
    create: {
      businessId: business.id,
      email: "admin@rebook.ai",
      passwordHash,
      name: "Demo Admin",
    },
  });

  console.log("Seed complete. Login: admin@rebook.ai / demo1234");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());