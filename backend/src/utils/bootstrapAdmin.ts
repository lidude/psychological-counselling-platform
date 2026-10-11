import bcrypt from "bcrypt";
import { UserRole } from "@prisma/client";
import prisma from "../lib/prisma";

export const BOOTSTRAP_ADMIN_EMAIL = "salmamustefa@gmail.com";

/**
 * Ensures that the system administrator account "salmamustefa@gmail.com"
 * is automatically provisioned or upgraded to the ADMIN role.
 * Runs on application startup and during database seed operations.
 */
export const bootstrapAdmin = async (): Promise<void> => {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: BOOTSTRAP_ADMIN_EMAIL },
    });

    if (existingUser) {
      if (existingUser.role !== UserRole.ADMIN) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { role: UserRole.ADMIN },
        });
        console.log(
          `[Admin Bootstrap] User "${BOOTSTRAP_ADMIN_EMAIL}" role updated to ADMIN.`
        );
      } else {
        console.log(
          `[Admin Bootstrap] Verified system administrator "${BOOTSTRAP_ADMIN_EMAIL}" has ADMIN privileges.`
        );
      }
    } else {
      const initialPassword =
        process.env.ADMIN_INITIAL_PASSWORD || "Password123";
      const hashedPassword = await bcrypt.hash(initialPassword, 10);

      const newAdmin = await prisma.user.create({
        data: {
          email: BOOTSTRAP_ADMIN_EMAIL,
          password: hashedPassword,
          firstName: "Salma",
          lastName: "Mustefa",
          phone: "+251911000000",
          role: UserRole.ADMIN,
        },
      });

      console.log(
        `[Admin Bootstrap] Provisioned new system administrator: "${newAdmin.email}" (ID: ${newAdmin.id}) with role ADMIN.`
      );
    }
  } catch (error) {
    console.warn(
      `[Admin Bootstrap] Warning: Unable to complete admin bootstrap check:`,
      error instanceof Error ? error.message : error
    );
  }
};
