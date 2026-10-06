import bcrypt from "bcrypt";
import { UserRole, VerificationStatus, CertificateType } from "@prisma/client";
import prisma from "../lib/prisma";
import { ApiError } from "../utils/apiError";

export interface AdminUserPayload {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRole;
  createdAt: Date;
}

const sanitizeUser = (user: {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRole;
  createdAt: Date;
}): AdminUserPayload => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  phone: user.phone,
  role: user.role,
  createdAt: user.createdAt,
});

export const getUsersByRole = async (role: UserRole): Promise<AdminUserPayload[]> => {
  const users = await prisma.user.findMany({
    where: { role },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return users.map(sanitizeUser);
};

export const getUserById = async (id: number): Promise<AdminUserPayload> => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  return sanitizeUser(user);
};

export const updateUser = async (
  id: number,
  data: {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    password?: string;
  }
): Promise<AdminUserPayload> => {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("User not found");
  }

  if (data.email && data.email !== existing.email) {
    const emailTaken = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (emailTaken) {
      throw ApiError.badRequest("Email is already in use");
    }
  }

  const updateData: {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string | null;
    password?: string;
  } = {};

  if (data.email !== undefined) updateData.email = data.email;
  if (data.firstName !== undefined) updateData.firstName = data.firstName;
  if (data.lastName !== undefined) updateData.lastName = data.lastName;
  if (data.phone !== undefined) updateData.phone = data.phone || null;
  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 10);
  }

  if (Object.keys(updateData).length === 0) {
    throw ApiError.badRequest("No fields provided for update");
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  });

  return sanitizeUser(user);
};

export const deleteUser = async (id: number): Promise<void> => {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("User not found");
  }

  if (existing.role === UserRole.ADMIN) {
    throw ApiError.forbidden("Cannot delete admin accounts");
  }

  await prisma.user.delete({ where: { id } });
};

export interface AdminCounselorProfilePayload {
  id: number;
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRole;
  bio: string | null;
  totalSessions: number;
  verificationStatus: VerificationStatus;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  certificates: {
    id: number;
    type: CertificateType;
    fileUrl: string;
    createdAt: Date;
  }[];
  fields: {
    id: number;
    name: string;
    description: string | null;
  }[];
}

export const getCounselorProfiles = async (status?: VerificationStatus): Promise<AdminCounselorProfilePayload[]> => {
  const where: { verificationStatus?: VerificationStatus } = {};
  if (status) {
    where.verificationStatus = status;
  }

  const profiles = await prisma.counselorProfile.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          createdAt: true,
        },
      },
      certificates: {
        select: {
          id: true,
          type: true,
          fileUrl: true,
          createdAt: true,
        },
      },
      fields: {
        include: {
          field: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return profiles.map((profile) => ({
    id: profile.id,
    userId: profile.user.id,
    email: profile.user.email,
    firstName: profile.user.firstName,
    lastName: profile.user.lastName,
    phone: profile.user.phone,
    role: profile.user.role,
    bio: profile.bio,
    totalSessions: profile.totalSessions,
    verificationStatus: profile.verificationStatus,
    rejectionReason: profile.rejectionReason,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    certificates: profile.certificates,
    fields: profile.fields.map((cf) => cf.field),
  }));
};

export const getCounselorProfileById = async (id: number): Promise<AdminCounselorProfilePayload> => {
  const profile = await prisma.counselorProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          createdAt: true,
        },
      },
      certificates: {
        select: {
          id: true,
          type: true,
          fileUrl: true,
          createdAt: true,
        },
      },
      fields: {
        include: {
          field: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      },
    },
  });

  if (!profile) {
    throw ApiError.notFound("Counselor profile not found");
  }

  return {
    id: profile.id,
    userId: profile.user.id,
    email: profile.user.email,
    firstName: profile.user.firstName,
    lastName: profile.user.lastName,
    phone: profile.user.phone,
    role: profile.user.role,
    bio: profile.bio,
    totalSessions: profile.totalSessions,
    verificationStatus: profile.verificationStatus,
    rejectionReason: profile.rejectionReason,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    certificates: profile.certificates,
    fields: profile.fields.map((cf) => cf.field),
  };
};

export const verifyCounselorProfile = async (id: number, status: VerificationStatus, reason?: string): Promise<AdminCounselorProfilePayload> => {
  const profile = await prisma.counselorProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          createdAt: true,
        },
      },
      certificates: {
        select: {
          id: true,
          type: true,
          fileUrl: true,
          createdAt: true,
        },
      },
      fields: {
        include: {
          field: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      },
    },
  });

  if (!profile) {
    throw ApiError.notFound("Counselor profile not found");
  }

  if (status !== VerificationStatus.APPROVED && status !== VerificationStatus.REJECTED) {
    throw ApiError.badRequest("Invalid verification status. Use APPROVED or REJECTED");
  }

  if (status === VerificationStatus.REJECTED) {
    if (!reason || reason.trim() === "") {
      throw ApiError.badRequest("Rejection reason is required when rejecting a counselor");
    }
  }

  const updateData: { verificationStatus: VerificationStatus; rejectionReason: string | null } = {
    verificationStatus: status,
    rejectionReason: status === VerificationStatus.REJECTED && reason ? reason.trim() : null,
  };

  const updated = await prisma.counselorProfile.update({
    where: { id },
    data: updateData,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          createdAt: true,
        },
      },
      certificates: {
        select: {
          id: true,
          type: true,
          fileUrl: true,
          createdAt: true,
        },
      },
      fields: {
        include: {
          field: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      },
    },
  });

  return {
    id: updated.id,
    userId: updated.user.id,
    email: updated.user.email,
    firstName: updated.user.firstName,
    lastName: updated.user.lastName,
    phone: updated.user.phone,
    role: updated.user.role,
    bio: updated.bio,
    totalSessions: updated.totalSessions,
    verificationStatus: updated.verificationStatus,
    rejectionReason: updated.rejectionReason,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
    certificates: updated.certificates,
    fields: updated.fields.map((cf) => cf.field),
  };
};
