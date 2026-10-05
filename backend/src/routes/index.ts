import { Router } from "express";
import fieldsRouter from "./fields";
import counselorsRouter from "./counselors";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ message: "API v1" });
});

router.use("/fields", fieldsRouter);
router.use("/counselors", counselorsRouter);

export default router;
