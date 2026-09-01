import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { ApiError } from "../utils/apiError";
import prisma from "../lib/prisma";

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

interface TokenPayload extends JwtPayload {
  id: number;
  email: string;
  role: string;
}

export const authMiddleware = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw ApiError.unauthorized("Missing or invalid authorization header");
    }

    const token = header.split(" ")[1];
    if (!token) {
      throw ApiError.unauthorized("Missing token");
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw ApiError.internal("JWT_SECRET is not configured");
    }

    let decoded: TokenPayload;
    try {
      decoded = jwt.verify(token, secret) as TokenPayload;
    } catch {
      throw ApiError.unauthorized("Invalid or expired token");
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      throw ApiError.unauthorized("User no longer exists");
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (err) {
    next(err);
  }
};