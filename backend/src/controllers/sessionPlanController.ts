import prisma from "../lib/prisma";
import { ApiError } from "../utils/apiError";
import { VerificationStatus } from "@prisma/client";

export interface SessionPlanPayload {
  id: number;
  duration: number;
  price: number;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

const serializePlan = (plan: {
  id: number;
  duration: number;
  price: any;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}): SessionPlanPayload => ({
  id: plan.id,
  duration: plan.duration,
  price: Number(plan.price.toString()),
  quantity: plan.quantity,
  createdAt: plan.createdAt,
  updatedAt: plan.updatedAt,
});

export const createSessionPlan = async (counselorProfileId: number, duration: number, price: number, quantity: number): Promise<SessionPlanPayload> => {
  const profile = await prisma.counselorProfile.findUnique({
    where: { id: counselorProfileId },
  });

  if (!profile) {
    throw ApiError.notFound("Counselor profile not found");
  }

  if (profile.verificationStatus !== VerificationStatus.APPROVED) {
    throw ApiError.forbidden("Only approved counselors can create session plans");
  }

  if (![30, 60, 120].includes(duration)) {
    throw ApiError.badRequest("Duration must be 30, 60, or 120 minutes");
  }

  if (price <= 0) {
    throw ApiError.badRequest("Price must be a positive number");
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw ApiError.badRequest("Quantity must be a positive integer");
  }

  const existingTotal = await prisma.sessionPlan.aggregate({
    where: { counselorProfileId },
    _sum: { quantity: true },
  });

  const currentTotal = existingTotal._sum.quantity || 0;
  if (currentTotal + quantity > profile.totalSessions) {
    throw ApiError.badRequest(
      `Total quantity would exceed maximum sessions. Available: ${profile.totalSessions - currentTotal}`
    );
  }

  const plan = await prisma.sessionPlan.create({
    data: {
      counselorProfileId,
      duration,
      price: price.toString(),
      quantity,
    },
    select: {
      id: true,
      duration: true,
      price: true,
      quantity: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return serializePlan(plan);
};

export const getSessionPlans = async (counselorProfileId: number): Promise<SessionPlanPayload[]> => {
  const profile = await prisma.counselorProfile.findUnique({
    where: { id: counselorProfileId },
  });

  if (!profile) {
    throw ApiError.notFound("Counselor profile not found");
  }

  const plans = await prisma.sessionPlan.findMany({
    where: { counselorProfileId },
    select: {
      id: true,
      duration: true,
      price: true,
      quantity: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return plans.map(serializePlan);
};

export const updateSessionPlan = async (counselorProfileId: number, planId: number, duration: number, price: number, quantity: number): Promise<SessionPlanPayload> => {
  const profile = await prisma.counselorProfile.findUnique({
    where: { id: counselorProfileId },
  });

  if (!profile) {
    throw ApiError.notFound("Counselor profile not found");
  }

  if (profile.verificationStatus !== VerificationStatus.APPROVED) {
    throw ApiError.forbidden("Only approved counselors can update session plans");
  }

  const existingPlan = await prisma.sessionPlan.findUnique({
    where: { id: planId },
  });

  if (!existingPlan || existingPlan.counselorProfileId !== counselorProfileId) {
    throw ApiError.notFound("Session plan not found");
  }

  if (![30, 60, 120].includes(duration)) {
    throw ApiError.badRequest("Duration must be 30, 60, or 120 minutes");
  }

  if (price <= 0) {
    throw ApiError.badRequest("Price must be a positive number");
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw ApiError.badRequest("Quantity must be a positive integer");
  }

  const otherPlansTotal = await prisma.sessionPlan.aggregate({
    where: {
      counselorProfileId,
      id: { not: planId },
    },
    _sum: { quantity: true },
  });

  const currentTotal = otherPlansTotal._sum.quantity || 0;
  if (currentTotal + quantity > profile.totalSessions) {
    throw ApiError.badRequest(
      `Total quantity would exceed maximum sessions. Available: ${profile.totalSessions - currentTotal}`
    );
  }

  const plan = await prisma.sessionPlan.update({
    where: { id: planId },
    data: {
      duration,
      price: price.toString(),
      quantity,
    },
    select: {
      id: true,
      duration: true,
      price: true,
      quantity: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return serializePlan(plan);
};

export const deleteSessionPlan = async (counselorProfileId: number, planId: number): Promise<void> => {
  const profile = await prisma.counselorProfile.findUnique({
    where: { id: counselorProfileId },
  });

  if (!profile) {
    throw ApiError.notFound("Counselor profile not found");
  }

  if (profile.verificationStatus !== VerificationStatus.APPROVED) {
    throw ApiError.forbidden("Only approved counselors can delete session plans");
  }

  const existingPlan = await prisma.sessionPlan.findUnique({
    where: { id: planId },
  });

  if (!existingPlan || existingPlan.counselorProfileId !== counselorProfileId) {
    throw ApiError.notFound("Session plan not found");
  }

  await prisma.sessionPlan.delete({
    where: { id: planId },
  });
};
