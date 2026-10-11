import { Router, Request, Response, NextFunction } from "express";
import { body, param, query } from "express-validator";
import { UserRole, VerificationStatus } from "@prisma/client";
import { validate } from "../middleware/validate";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/role";
import { register } from "../controllers/authController";
import {
  getUsersByRole,
  getUserById,
  updateUser,
  changeUserRole,
  deleteUser,
  getSystemAnalytics,
  getSystemConfig,
  updateSystemConfig,
  getCounselorProfiles,
  getCounselorProfileById,
  verifyCounselorProfile,
} from "../controllers/adminController";

const router = Router();

// Strict RBAC: All admin endpoints require valid JWT and ADMIN role
router.use(authMiddleware, requireRole(UserRole.ADMIN));

/**
 * System analytics overview
 */
router.get("/analytics", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const analytics = await getSystemAnalytics();
    res.json({ success: true, data: analytics });
  } catch (err) {
    next(err);
  }
});

/**
 * Platform configurations
 */
router.get("/config", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const config = await getSystemConfig();
    res.json({ success: true, data: config });
  } catch (err) {
    next(err);
  }
});

router.put("/config", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updatedConfig = await updateSystemConfig(req.body);
    res.json({ success: true, data: updatedConfig });
  } catch (err) {
    next(err);
  }
});

/**
 * View users (can filter by CLIENT, COUNSELOR, ADMIN or view all)
 */
router.get(
  "/users",
  [
    query("role")
      .optional()
      .isIn(["CLIENT", "COUNSELOR", "ADMIN"])
      .withMessage("Role must be CLIENT, COUNSELOR, or ADMIN"),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const role = req.query.role as UserRole | undefined;
      const users = await getUsersByRole(role);
      res.json({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/users/:id",
  [param("id").isInt({ min: 1 }).withMessage("Valid user ID is required")],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      const user = await getUserById(id);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/users",
  [
    body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("firstName").notEmpty().withMessage("First name is required").trim(),
    body("lastName").notEmpty().withMessage("Last name is required").trim(),
    body("phone").optional().isString().trim(),
    body("role")
      .isIn(["CLIENT", "COUNSELOR", "ADMIN"])
      .withMessage("Role must be CLIENT, COUNSELOR, or ADMIN"),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await register(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  "/users/:id",
  [
    param("id").isInt({ min: 1 }).withMessage("Valid user ID is required"),
    body("email").optional().isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("firstName").optional().notEmpty().withMessage("First name cannot be empty").trim(),
    body("lastName").optional().notEmpty().withMessage("Last name cannot be empty").trim(),
    body("phone").optional({ nullable: true }).isString().trim(),
    body("password")
      .optional()
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("role")
      .optional()
      .isIn(["CLIENT", "COUNSELOR", "ADMIN"])
      .withMessage("Role must be CLIENT, COUNSELOR, or ADMIN"),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      const user = await updateUser(id, req.body);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Dedicated endpoint to assign/change user roles (Admin, Counselor, Client)
 */
router.patch(
  "/users/:id/role",
  [
    param("id").isInt({ min: 1 }).withMessage("Valid user ID is required"),
    body("role")
      .isIn(["CLIENT", "COUNSELOR", "ADMIN"])
      .withMessage("Role must be CLIENT, COUNSELOR, or ADMIN"),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { role } = req.body;
      const user = await changeUserRole(id, role as UserRole);
      res.json({
        success: true,
        message: `User role successfully updated to ${role}`,
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  "/users/:id",
  [param("id").isInt({ min: 1 }).withMessage("Valid user ID is required")],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      await deleteUser(id);
      res.json({ success: true, message: "User deleted successfully" });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/counselors",
  [
    query("status")
      .optional()
      .isIn(["PENDING", "APPROVED", "REJECTED"])
      .withMessage("Invalid status filter. Use PENDING, APPROVED, or REJECTED"),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = req.query.status as VerificationStatus | undefined;
      const counselors = await getCounselorProfiles(status);
      res.json({ success: true, data: counselors });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/counselors/:id",
  [param("id").isInt({ min: 1 }).withMessage("Valid counselor profile ID is required")],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      const counselor = await getCounselorProfileById(id);
      res.json({ success: true, data: counselor });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/counselors/:id/verify",
  [
    param("id").isInt({ min: 1 }).withMessage("Valid counselor profile ID is required"),
    body("status")
      .isIn(["APPROVED", "REJECTED"])
      .withMessage("Invalid verification status. Use APPROVED or REJECTED"),
    body("reason")
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage("Reason must not be empty when provided"),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { status, reason } = req.body;
      const result = await verifyCounselorProfile(id, status, reason);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
