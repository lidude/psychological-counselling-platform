import bcrypt from "bcrypt";
import { UserRole, VerificationStatus, CertificateType, SessionStatus } from "@prisma/client";
import prisma from "../lib/prisma";
import { ApiError } from "../utils/apiError";
import { BOOTSTRAP_ADMIN_EMAIL } from "../utils/bootstrapAdmin";

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

/**
 * Get users, optionally filtered by role. If no role provided, returns all users.
 */
export const getUsersByRole = async (role?: UserRole): Promise<AdminUserPayload[]> => {
  const where = role ? { role } : {};
  const users = await prisma.user.findMany({
    where,
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
    role?: UserRole;
  }
): Promise<AdminUserPayload> => {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("User not found");
  }

  // Prevent demoting primary administrator
  if (
    existing.email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase() &&
    data.role &&
    data.role !== UserRole.ADMIN
  ) {
    throw ApiError.forbidden("Cannot demote primary system administrator 'salmamustefa@gmail.com'");
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
    role?: UserRole;
  } = {};

  if (data.email !== undefined) updateData.email = data.email;
  if (data.firstName !== undefined) updateData.firstName = data.firstName;
  if (data.lastName !== undefined) updateData.lastName = data.lastName;
  if (data.phone !== undefined) updateData.phone = data.phone || null;
  if (data.role !== undefined) updateData.role = data.role;
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

/**
 * Assign or change a user's role (Admin, Counselor, Client)
 */
export const changeUserRole = async (id: number, newRole: UserRole): Promise<AdminUserPayload> => {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("User not found");
  }

  if (
    existing.email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase() &&
    newRole !== UserRole.ADMIN
  ) {
    throw ApiError.forbidden(
      "Cannot remove ADMIN role from primary bootstrap administrator 'salmamustefa@gmail.com'"
    );
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { role: newRole },
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

  return sanitizeUser(updated);
};

export const deleteUser = async (id: number): Promise<void> => {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("User not found");
  }

  if (existing.email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()) {
    throw ApiError.forbidden(
      "Cannot delete primary system administrator account 'salmamustefa@gmail.com'"
    );
  }

  if (existing.role === UserRole.ADMIN) {
    throw ApiError.forbidden("Cannot delete admin accounts");
  }

  await prisma.user.delete({ where: { id } });
};

/**
 * System-wide analytics and operational metrics
 */
export const getSystemAnalytics = async () => {
  const [
    totalUsers,
    totalClients,
    totalCounselors,
    totalAdmins,
    totalAppointments,
    totalSessions,
    scheduledSessions,
    inProgressSessions,
    completedSessions,
    cancelledSessions,
    pendingCounselorProfiles,
    approvedCounselorProfiles,
    rejectedCounselorProfiles,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: UserRole.CLIENT } }),
    prisma.user.count({ where: { role: UserRole.COUNSELOR } }),
    prisma.user.count({ where: { role: UserRole.ADMIN } }),
    prisma.appointment.count(),
    prisma.session.count(),
    prisma.session.count({ where: { status: SessionStatus.SCHEDULED } }),
    prisma.session.count({ where: { status: SessionStatus.IN_PROGRESS } }),
    prisma.session.count({ where: { status: SessionStatus.COMPLETED } }),
    prisma.session.count({ where: { status: SessionStatus.CANCELLED } }),
    prisma.counselorProfile.count({ where: { verificationStatus: VerificationStatus.PENDING } }),
    prisma.counselorProfile.count({ where: { verificationStatus: VerificationStatus.APPROVED } }),
    prisma.counselorProfile.count({ where: { verificationStatus: VerificationStatus.REJECTED } }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    users: {
      total: totalUsers,
      clients: totalClients,
      counselors: totalCounselors,
      admins: totalAdmins,
    },
    appointments: {
      total: totalAppointments,
    },
    sessions: {
      total: totalSessions,
      scheduled: scheduledSessions,
      inProgress: inProgressSessions,
      completed: completedSessions,
      cancelled: cancelledSessions,
    },
    counselorVerifications: {
      pending: pendingCounselorProfiles,
      approved: approvedCounselorProfiles,
      rejected: rejectedCounselorProfiles,
      total: pendingCounselorProfiles + approvedCounselorProfiles + rejectedCounselorProfiles,
    },
    recentUsers,
  };
};

/** Core platform configurations */
let coreConfig = {
  platformName: "MindBridge Psychological Counselling",
  allowClientRegistration: true,
  defaultUserRole: "CLIENT",
  bootstrapAdmin: BOOTSTRAP_ADMIN_EMAIL,
  sessionDurationOptions: [30, 60, 120],
  requireCounselorVerification: true,
  telehealthEnabled: true,
};

export const getSystemConfig = async () => {
  return coreConfig;
};

export const updateSystemConfig = async (updates: Partial<typeof coreConfig>) => {
  coreConfig = { ...coreConfig, ...updates };
  return coreConfig;
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
