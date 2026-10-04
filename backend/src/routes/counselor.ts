import { Router, Request, Response, NextFunction } from "express";
import { body } from "express-validator";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { requireRole } from "../middleware/role";
import { validate } from "../middleware/validate";
import prisma from "../lib/prisma";
import {
  createSessionPlan,
  getSessionPlans,
  updateSessionPlan,
  deleteSessionPlan,
} from "../controllers/sessionPlanController";
import { UserRole } from "@prisma/client";
import { ApiError } from "../utils/apiError";

const router = Router();

router.use(authMiddleware, requireRole(UserRole.COUNSELOR));

const resolveCounselorProfile = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required"));
    }

    const profile = await prisma.counselorProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!profile) {
      return next(ApiError.notFound("Counselor profile not found"));
    }

    (req as any).counselorProfileId = profile.id;
    next();
  } catch (err) {
    next(err);
  }
};

router.post(
  "/session-plans",
  resolveCounselorProfile,
  [
    body("duration")
      .isInt({ min: 30, max: 120 })
      .withMessage("Duration must be 30, 60, or 120 minutes")
      .custom((value) => {
        if (![30, 60, 120].includes(value)) {
          throw new Error("Duration must be 30, 60, or 120 minutes");
        }
        return true;
      }),
    body("price")
      .isFloat({ gt: 0 })
      .withMessage("Price must be a positive number"),
    body("quantity")
      .isInt({ gt: 0 })
      .withMessage("Quantity must be a positive integer"),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const counselorProfileId = (req as any).counselorProfileId as number;
      const result = await createSessionPlan(
        counselorProfileId,
        Number(req.body.duration),
        Number(req.body.price),
        Number(req.body.quantity)
      );
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/session-plans",
  resolveCounselorProfile,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const counselorProfileId = (req as any).counselorProfileId as number;
      const result = await getSessionPlans(counselorProfileId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  "/session-plans/:id",
  resolveCounselorProfile,
  [
    body("duration")
      .optional()
      .isInt({ min: 30, max: 120 })
      .withMessage("Duration must be 30, 60, or 120 minutes")
      .custom((value) => {
        if (![30, 60, 120].includes(value)) {
          throw new Error("Duration must be 30, 60, or 120 minutes");
        }
        return true;
      }),
    body("price")
      .optional()
      .isFloat({ gt: 0 })
      .withMessage("Price must be a positive number"),
    body("quantity")
      .optional()
      .isInt({ gt: 0 })
      .withMessage("Quantity must be a positive integer"),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const counselorProfileId = (req as any).counselorProfileId as number;
      const planId = Number(req.params.id);
      const result = await updateSessionPlan(
        counselorProfileId,
        planId,
        Number(req.body.duration),
        Number(req.body.price),
        Number(req.body.quantity)
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  "/session-plans/:id",
  resolveCounselorProfile,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const counselorProfileId = (req as any).counselorProfileId as number;
      const planId = Number(req.params.id);
      await deleteSessionPlan(counselorProfileId, planId);
      res.json({ success: true, data: { id: planId } });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
