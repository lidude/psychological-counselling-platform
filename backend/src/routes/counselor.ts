import { Router, Request, Response, NextFunction } from "express";
import { body, param } from "express-validator";
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
import {
  getCounselorClients,
  getCounselorAppointments,
  getCounselorSessions,
  updateSessionNotes,
  updateSessionStatus,
  getCounselorDashboardStats,
} from "../controllers/counselorController";
import { UserRole, SessionStatus } from "@prisma/client";
import { ApiError } from "../utils/apiError";

const router = Router();

// Protect all counselor routes with JWT auth and strict COUNSELOR role
router.use(authMiddleware, requireRole(UserRole.COUNSELOR));

// Counselor dashboard summary metrics
router.get("/dashboard-stats", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const stats = await getCounselorDashboardStats(authReq.user!.id);
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
});

// Counselor assigned clients
router.get("/clients", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const clients = await getCounselorClients(authReq.user!.id);
    res.json({ success: true, data: clients });
  } catch (err) {
    next(err);
  }
});

// Counselor appointments
router.get("/appointments", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const appointments = await getCounselorAppointments(authReq.user!.id);
    res.json({ success: true, data: appointments });
  } catch (err) {
    next(err);
  }
});

// Counselor sessions and notes
router.get("/sessions", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const sessions = await getCounselorSessions(authReq.user!.id);
    res.json({ success: true, data: sessions });
  } catch (err) {
    next(err);
  }
});

router.put(
  "/sessions/:id/notes",
  [
    param("id").isInt({ min: 1 }).withMessage("Valid session ID required"),
    body("notes").isString().withMessage("Notes must be a string"),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;
      const sessionId = Number(req.params.id);
      const updated = await updateSessionNotes(authReq.user!.id, sessionId, req.body.notes);
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  "/sessions/:id/status",
  [
    param("id").isInt({ min: 1 }).withMessage("Valid session ID required"),
    body("status")
      .isIn(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"])
      .withMessage("Invalid session status"),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;
      const sessionId = Number(req.params.id);
      const updated = await updateSessionStatus(
        authReq.user!.id,
        sessionId,
        req.body.status as SessionStatus
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

// Counselor Profile Resolver for Session Plans
const resolveCounselorProfile = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required"));
    }

    let profile = await prisma.counselorProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!profile) {
      // Create empty profile if not yet created so session plans work seamlessly
      profile = await prisma.counselorProfile.create({
        data: {
          userId: req.user.id,
          bio: "Registered Mental Health Professional",
        },
      });
    }

    (req as any).counselorProfileId = profile.id;
    next();
  } catch (err) {
    next(err);
  }
};

// Session plans management
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
