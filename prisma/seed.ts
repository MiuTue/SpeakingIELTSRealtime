import { PrismaClient } from "@prisma/client";
import { auth } from "../lib/auth";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "winna123456pro@gmail.com";
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existing && !adminPassword) {
    throw new Error("ADMIN_INITIAL_PASSWORD must be set before seeding the first admin account.");
  }

  if (!existing && adminPassword) {
    await auth.api.signUpEmail({
      body: {
        name: "SpeakIELTS Admin",
        email: adminEmail,
        password: adminPassword,
        targetBand: 8
      }
    });
  }

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN" },
    create: {
      name: "SpeakIELTS Admin",
      email: adminEmail,
      role: "ADMIN",
      emailVerified: true,
      targetBand: 8
    }
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
