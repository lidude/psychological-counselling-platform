import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { requireRole } from "../middleware/role";
import { UserRole } from "@prisma/client";

const router = Router();

router.get(
  "/admin/test",
  authMiddleware,
  requireRole(UserRole.ADMIN),
  (req: Request, res: Response, _next: NextFunction) => {
    res.json({
      success: true,
      message: "Admin access granted",
      user: (req as AuthRequest).user,
    });
  }
);

router.get(
  "/counselor/test",
  authMiddleware,
  requireRole(UserRole.COUNSELOR),
  (req: Request, res: Response, _next: NextFunction) => {
    res.json({
      success: true,
      message: "Counselor access granted",
      user: (req as AuthRequest).user,
    });
  }
);

router.get(
  "/client/test",
  authMiddleware,
  requireRole(UserRole.CLIENT),
  (req: Request, res: Response, _next: NextFunction) => {
    res.json({
      success: true,
      message: "Client access granted",
      user: (req as AuthRequest).user,
    });
  }
);

export default router;