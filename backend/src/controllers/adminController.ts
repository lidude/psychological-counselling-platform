import bcrypt from "bcrypt";
import { UserRole } from "@prisma/client";
import prisma from "../lib/prisma";
import { ApiError } from "../utils/apiError";

export interface AdminUserPayload {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRole;
  createdAt: Date;
}

const sanitizeUser = (user: {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRole;
  createdAt: Date;
}): AdminUserPayload => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  phone: user.phone,
  role: user.role,
  createdAt: user.createdAt,
});

export const getUsersByRole = async (role: UserRole): Promise<AdminUserPayload[]> => {
  const users = await prisma.user.findMany({
    where: { role },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return users.map(sanitizeUser);
};

export const getUserById = async (id: number): Promise<AdminUserPayload> => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  return sanitizeUser(user);
};

export const updateUser = async (
  id: number,
  data: {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    password?: string;
  }
): Promise<AdminUserPayload> => {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("User not found");
  }

  if (data.email && data.email !== existing.email) {
    const emailTaken = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (emailTaken) {
      throw ApiError.badRequest("Email is already in use");
    }
  }

  const updateData: Record<string, unknown> = {};

  if (data.email !== undefined) updateData.email = data.email;
  if (data.firstName !== undefined) updateData.firstName = data.firstName;
  if (data.lastName !== undefined) updateData.lastName = data.lastName;
  if (data.phone !== undefined) updateData.phone = data.phone || null;
  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 10);
  }

  if (Object.keys(updateData).length === 0) {
    throw ApiError.badRequest("No fields provided for update");
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  });

  return sanitizeUser(user);
};

export const deleteUser = async (id: number): Promise<void> => {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("User not found");
  }

  if (existing.role === UserRole.ADMIN) {
    throw ApiError.forbidden("Cannot delete admin accounts");
  }

  await prisma.user.delete({ where: { id } });
};
