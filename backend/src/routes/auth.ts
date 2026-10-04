import { Router, Request, Response, NextFunction } from "express";
import { body } from "express-validator";
import { register, login, getMe, clientSignup, counselorSignup } from "../controllers/authController";
import { validate } from "../middleware/validate";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import upload from "../middleware/upload";

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
  "/signup/client",
  [
    body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("firstName").notEmpty().withMessage("First name is required").trim(),
    body("lastName").notEmpty().withMessage("Last name is required").trim(),
    body("phone").optional().isString().trim(),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await clientSignup(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/signup/counselor",
  upload.array("certificates", 10),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fieldIds = Array.isArray(req.body.fieldIds)
        ? (req.body.fieldIds as unknown[]).map((id) => Number(id as string))
        : typeof req.body.fieldIds === "string"
        ? JSON.parse(req.body.fieldIds).map((id: string) => Number(id))
        : [];

      const certificateTypes = Array.isArray(req.body.certificateTypes)
        ? (req.body.certificateTypes as string[])
        : typeof req.body.certificateTypes === "string"
        ? JSON.parse(req.body.certificateTypes)
        : [];

      const result = await counselorSignup({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        phone: req.body.phone,
        password: req.body.password,
        bio: req.body.bio,
        fieldIds,
        certificates: (req as any).files as Express.Multer.File[],
        certificateTypes,
      });

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