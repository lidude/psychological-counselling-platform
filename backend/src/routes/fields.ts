import { Router, Request, Response, NextFunction } from "express";
import { body, param } from "express-validator";
import { validate } from "../middleware/validate";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/role";
import { UserRole } from "@prisma/client";
import {
  getFields,
  getFieldById,
  createField,
  updateField,
  deleteField,
} from "../controllers/fieldController";

const router = Router();

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fields = await getFields();
    res.json({ success: true, data: fields });
  } catch (err) {
    next(err);
  }
});

router.get(
  "/:id",
  [param("id").isInt({ min: 1 }).withMessage("Valid field ID is required")],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      const field = await getFieldById(id);
      res.json({ success: true, data: field });
    } catch (err) {
      next(err);
    }
  }
);

router.use(authMiddleware, requireRole(UserRole.ADMIN));

router.post(
  "/",
  [
    body("name")
      .notEmpty()
      .withMessage("Field name is required")
      .trim()
      .isLength({ max: 100 })
      .withMessage("Field name must not exceed 100 characters"),
    body("description")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Description must not exceed 500 characters"),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const field = await createField(req.body);
      res.status(201).json({ success: true, data: field });
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  "/:id",
  [
    param("id").isInt({ min: 1 }).withMessage("Valid field ID is required"),
    body("name")
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage("Field name must not exceed 100 characters"),
    body("description")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Description must not exceed 500 characters"),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      const field = await updateField(id, req.body);
      res.json({ success: true, data: field });
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  "/:id",
  [param("id").isInt({ min: 1 }).withMessage("Valid field ID is required")],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      await deleteField(id);
      res.json({ success: true, message: "Field deleted successfully" });
    } catch (err) {
      next(err);
    }
  }
);

export default router;