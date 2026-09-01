import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error("Error:", err);

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  return res.status(500).json({
    success: false,
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
};
