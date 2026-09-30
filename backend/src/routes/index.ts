import { Router } from "express";
import fieldsRouter from "./fields";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ message: "API v1" });
});

router.use("/fields", fieldsRouter);

export default router;
