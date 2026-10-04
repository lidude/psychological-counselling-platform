import { Router, Request, Response, NextFunction } from "express";
import { query } from "express-validator";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { validate } from "../middleware/validate";
import prisma from "../lib/prisma";
import { ApiError } from "../utils/apiError";

export interface CounselorFieldPayload {
  id: number;
  name: string;
  description: string | null;
}

export interface SessionPlanPublicPayload {
  id: number;
  duration: number;
  price: number;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CounselorPublicPayload {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  bio: string | null;
  totalSessions: number;
  fields: CounselorFieldPayload[];
  sessionPlans: SessionPlanPublicPayload[];
}

const serializePlan = (plan: {
  id: number;
  duration: number;
  price: any;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}): SessionPlanPublicPayload => ({
  id: plan.id,
  duration: plan.duration,
  price: Number(plan.price.toString()),
  quantity: plan.quantity,
  createdAt: plan.createdAt,
  updatedAt: plan.updatedAt,
});

export const getApprovedCounselors = async (fieldId?: number): Promise<CounselorPublicPayload[]> => {
  if (fieldId !== undefined) {
    const field = await prisma.field.findUnique({
      where: { id: fieldId },
      select: { id: true },
    });

    if (!field) {
      throw ApiError.notFound("Field not found");
    }
  }

  const where: any = {
    verificationStatus: "APPROVED",
    ...(fieldId !== undefined ? { fields: { some: { fieldId } } } : {}),
  };

  const profiles = await prisma.counselorProfile.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      sessionPlans: {
        select: {
          id: true,
          duration: true,
          price: true,
          quantity: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      fields: {
        include: {
          field: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return profiles.map((profile) => ({
    id: profile.id,
    userId: profile.user.id,
    firstName: profile.user.firstName,
    lastName: profile.user.lastName,
    bio: profile.bio,
    totalSessions: profile.totalSessions,
    fields: profile.fields.map((cf) => ({
      id: cf.field.id,
      name: cf.field.name,
      description: cf.field.description,
    })),
    sessionPlans: profile.sessionPlans.map(serializePlan),
  }));
};

const router = Router();

router.use(authMiddleware);

router.get(
  "/",
  [
    query("fieldId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Valid field ID is required"),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fieldId = req.query.fieldId ? parseInt(req.query.fieldId as string, 10) : undefined;
      const counselors = await getApprovedCounselors(fieldId);
      res.json({ success: true, data: counselors });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
