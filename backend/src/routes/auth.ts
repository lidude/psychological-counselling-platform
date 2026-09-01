import { Router, Request, Response, NextFunction } from "express";
import { body } from "express-validator";
import { register, login, getMe } from "../controllers/authController";
import { validate } from "../middleware/validate";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

router.post(
  "/register",
  [
    body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("firstName").notEmpty().withMessage("First name is required").trim(),
    body("lastName").notEmpty().withMessage("Last name is required").trim(),
    body("phone").optional().isString().trim(),
    body("role")
      .optional()
      .isIn(["CLIENT", "COUNSELOR", "ADMIN"])
      .withMessage("Invalid role"),
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

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await login(req.body);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/me",
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = await getMe(req.user!.id);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }
);

export default router;