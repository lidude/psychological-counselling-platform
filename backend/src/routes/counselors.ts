import { Router, Request, Response, NextFunction } from "express";
import { query } from "express-validator";
import { authMiddleware } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { getApprovedCounselors } from "../controllers/counselorController";

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
