import { Router, Request, Response, NextFunction } from "express";
import { body, param } from "express-validator";
import { UserRole } from "@prisma/client";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { requireRole } from "../middleware/role";
import { validate } from "../middleware/validate";
import {
  getClientProfile,
  updateClientProfile,
  getAvailableCounselors,
  getClientAppointments,
  bookClientAppointment,
  cancelClientAppointment,
  getClientSessions,
} from "../controllers/clientController";

const router = Router();

// Protect all client routes with JWT authentication and strict CLIENT role checking
router.use(authMiddleware, requireRole(UserRole.CLIENT));

// Client profile
router.get("/profile", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const profile = await getClientProfile(authReq.user!.id);
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
});

router.put(
  "/profile",
  [
    body("firstName").optional().trim().notEmpty().withMessage("First name cannot be empty"),
    body("lastName").optional().trim().notEmpty().withMessage("Last name cannot be empty"),
    body("phone").optional({ nullable: true }).trim(),
    body("emergencyContact").optional({ nullable: true }).trim(),
    body("gender").optional({ nullable: true }).trim(),
    body("dateOfBirth").optional({ nullable: true }).isISO8601().withMessage("Valid date format required"),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;
      const updated = await updateClientProfile(authReq.user!.id, req.body);
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

// View available counselors
router.get("/counselors", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const counselors = await getAvailableCounselors();
    res.json({ success: true, data: counselors });
  } catch (err) {
    next(err);
  }
});

// Client appointments
router.get("/appointments", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const appointments = await getClientAppointments(authReq.user!.id);
    res.json({ success: true, data: appointments });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/appointments",
  [
    body("counselorId").isInt({ min: 1 }).withMessage("Valid counselor ID required"),
    body("date").isISO8601().withMessage("Valid date required (YYYY-MM-DD)"),
    body("startTime").matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage("Start time must be HH:MM format"),
    body("endTime").matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage("End time must be HH:MM format"),
    body("type").optional().isString().trim(),
    body("notes").optional().isString().trim(),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;
      const appointment = await bookClientAppointment(authReq.user!.id, {
        counselorId: Number(req.body.counselorId),
        date: req.body.date,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        type: req.body.type || "Online Counselling",
        notes: req.body.notes,
      });
      res.status(201).json({ success: true, data: appointment });
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  "/appointments/:id",
  [param("id").isInt({ min: 1 }).withMessage("Valid appointment ID required")],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;
      const appointmentId = Number(req.params.id);
      const result = await cancelClientAppointment(authReq.user!.id, appointmentId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// Client sessions
router.get("/sessions", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const sessions = await getClientSessions(authReq.user!.id);
    res.json({ success: true, data: sessions });
  } catch (err) {
    next(err);
  }
});

export default router;
