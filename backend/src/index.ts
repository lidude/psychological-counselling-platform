import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import adminRoutes from "./routes/admin";
import protectedRoutes from "./routes/protected";
import counselorRoutes from "./routes/counselor";
import clientRoutes from "./routes/client";
import apiRouter from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import { bootstrapAdmin } from "./utils/bootstrapAdmin";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/counselor", counselorRoutes);
app.use("/api/client", clientRoutes);
app.use("/api", protectedRoutes);
app.use("/api", apiRouter);

// Error handling middleware (must be last)
app.use(errorHandler);

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);

  // Automatically provision or elevate bootstrap administrator salmamustefa@gmail.com
  await bootstrapAdmin();
});

export default app;