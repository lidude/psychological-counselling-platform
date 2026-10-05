import bcrypt from "bcrypt";
import { UserRole } from "@prisma/client";
import prisma from "../src/lib/prisma";

const SEED_USERS = [
  {
    email: "admin@gmail.com",
    password: "Password123",
    firstName: "Admin",
    lastName: "User",
    phone: "+1234567890",
    role: UserRole.ADMIN,
  },
  {
    email: "admin@test.com",
    password: "Password123",
    firstName: "Admin",
    lastName: "User",
    phone: null as string | null,
    role: UserRole.ADMIN,
  },
  {
    email: "counselor@gmail.com",
    password: "Password123",
    firstName: "Counselor",
    lastName: "User",
    phone: "+1234567891",
    role: UserRole.COUNSELOR,
  },
  {
    email: "client@gmail.com",
    password: "Password123",
    firstName: "Client",
    lastName: "User",
    phone: "+1234567892",
    role: UserRole.CLIENT,
  },
];

const seed = async () => {
  for (const userData of SEED_USERS) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: { password: hashedPassword },
      create: {
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        role: userData.role,
      },
    });

    console.log(`Seeded: ${user.email} (${user.role})`);
  }

  console.log("Seed completed successfully.");
};

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
