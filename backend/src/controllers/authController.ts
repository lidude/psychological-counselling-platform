import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { Prisma, UserRole, VerificationStatus, CertificateType } from "@prisma/client";
import prisma from "../lib/prisma";
import { ApiError } from "../utils/apiError";

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthUserPayload {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRole;
  avatar: string | null;
  createdAt: Date;
}

export interface AuthResponse {
  user: AuthUserPayload;
  token: string;
}

export interface CounselorSignupInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  bio?: string;
  fieldIds: number[];
  certificates: Express.Multer.File[];
  certificateTypes: string[];
}

const sanitizeUser = (
  user: Prisma.UserGetPayload<{ select: { id: true; email: true; firstName: true; lastName: true; phone: true; role: true; avatar: true; createdAt: true } }>
): AuthUserPayload => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  phone: user.phone,
  role: user.role,
  avatar: user.avatar,
  createdAt: user.createdAt,
});

const signToken = (user: { id: number; email: string; role: UserRole }): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw ApiError.internal("JWT_SECRET is not configured");
  }
  const expiresIn = (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"];
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    secret,
    { expiresIn }
  );
};

export const register = async (input: RegisterInput): Promise<AuthResponse> => {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw ApiError.badRequest("Email is already registered");
  }

  const hashedPassword = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      password: hashedPassword,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      role: input.role ?? UserRole.CLIENT,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      avatar: true,
      createdAt: true,
    },
  });

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  return { user: sanitizeUser(user), token };
};

export const clientSignup = async (input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}): Promise<AuthResponse> => {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw ApiError.badRequest("Email is already registered");
  }

  const hashedPassword = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      password: hashedPassword,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      role: UserRole.CLIENT,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      avatar: true,
      createdAt: true,
    },
  });

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  return { user: sanitizeUser(user), token };
};

export const counselorSignup = async (input: CounselorSignupInput): Promise<AuthResponse> => {
  if (!input.firstName || !input.lastName || !input.email || !input.password) {
    throw ApiError.badRequest("Missing required fields: firstName, lastName, email, password");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(input.email)) {
    throw ApiError.badRequest("Valid email is required");
  }

  if (input.password.length < 8) {
    throw ApiError.badRequest("Password must be at least 8 characters");
  }

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw ApiError.badRequest("Email is already registered");
  }

  if (!input.fieldIds || input.fieldIds.length === 0) {
    throw ApiError.badRequest("At least one field is required");
  }

  if (!input.certificates || input.certificates.length === 0) {
    throw ApiError.badRequest("At least one certificate is required");
  }

  if (!input.certificateTypes || input.certificateTypes.length !== input.certificates.length) {
    throw ApiError.badRequest("certificateTypes must match certificates");
  }

  const fields = await prisma.field.findMany({
    where: { id: { in: input.fieldIds.map(Number) } },
  });
  if (fields.length !== input.fieldIds.length) {
    throw ApiError.badRequest("One or more field IDs are invalid");
  }

  const hasEducation = input.certificateTypes.some((type) => type === "EDUCATION");
  const hasWorkPermit = input.certificateTypes.some((type) => type === "WORK_PERMIT");

  if (!hasEducation) {
    throw ApiError.badRequest("At least one EDUCATION certificate is required");
  }
  if (!hasWorkPermit) {
    throw ApiError.badRequest("At least one WORK_PERMIT certificate is required");
  }

  const hashedPassword = await bcrypt.hash(input.password, 10);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone || null,
        role: UserRole.COUNSELOR,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });

    const profile = await tx.counselorProfile.create({
      data: {
        userId: user.id,
        bio: input.bio || null,
        verificationStatus: VerificationStatus.PENDING,
      },
    });

    await tx.counselorField.createMany({
      data: input.fieldIds.map((fieldId) => ({
        counselorProfileId: profile.id,
        fieldId: Number(fieldId),
      })),
    });

    await tx.certificate.createMany({
      data: input.certificates.map((file, index) => ({
        counselorProfileId: profile.id,
        type: input.certificateTypes[index] as CertificateType,
        fileUrl: `/uploads/certificates/${file.filename}`,
      })),
    });

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    return { user: sanitizeUser(user), token };
  });

  return result;
};

export const login = async (input: LoginInput): Promise<AuthResponse> => {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const valid = await bcrypt.compare(input.password, user.password);
  if (!valid) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role });

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      createdAt: user.createdAt,
    },
    token,
  };
};

export const getMe = async (userId: number): Promise<AuthUserPayload> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      avatar: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  return sanitizeUser(user);
};