import { Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";
import { AuthRequest } from "./auth";
import { ApiError } from "../utils/apiError";

export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required"));
    }

    if (!roles.includes(req.user.role as UserRole)) {
      return next(
        ApiError.forbidden(
          `Forbidden: requires one of the following roles: ${roles.join(", ")}`
        )
      );
    }

    next();
  };
};