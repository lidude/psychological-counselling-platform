import { Field, Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { ApiError } from "../utils/apiError";

export interface FieldPayload {
  id: number;
  name: string;
  description: string | null;
}

export const getFields = async (): Promise<FieldPayload[]> => {
  const fields = await prisma.field.findMany({
    select: {
      id: true,
      name: true,
      description: true,
    },
    orderBy: { name: "asc" },
  });
  return fields;
};

export const getFieldById = async (id: number): Promise<FieldPayload> => {
  const field = await prisma.field.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
    },
  });

  if (!field) {
    throw ApiError.notFound("Field not found");
  }

  return field;
};

export const createField = async (data: { name: string; description?: string }): Promise<FieldPayload> => {
  const existing = await prisma.field.findUnique({
    where: { name: data.name },
  });

  if (existing) {
    throw ApiError.badRequest("Field name already exists");
  }

  const field = await prisma.field.create({
    data: {
      name: data.name,
      description: data.description || null,
    },
    select: {
      id: true,
      name: true,
      description: true,
    },
  });

  return field;
};

export const updateField = async (
  id: number,
  data: { name?: string; description?: string }
): Promise<FieldPayload> => {
  const existing = await prisma.field.findUnique({
    where: { id },
  });

  if (!existing) {
    throw ApiError.notFound("Field not found");
  }

  if (data.name && data.name !== existing.name) {
    const nameTaken = await prisma.field.findUnique({
      where: { name: data.name },
    });
    if (nameTaken) {
      throw ApiError.badRequest("Field name already exists");
    }
  }

  const field = await prisma.field.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
    },
    select: {
      id: true,
      name: true,
      description: true,
    },
  });

  return field;
};

export const deleteField = async (id: number): Promise<void> => {
  const existing = await prisma.field.findUnique({
    where: { id },
  });

  if (!existing) {
    throw ApiError.notFound("Field not found");
  }

  await prisma.field.delete({
    where: { id },
  });
};