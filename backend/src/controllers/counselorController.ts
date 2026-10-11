import { Router, Request, Response, NextFunction } from "express";
import { query } from "express-validator";
import { SessionStatus } from "@prisma/client";
import { authMiddleware } from "../middleware/auth";
import { validate } from "../middleware/validate";
import prisma from "../lib/prisma";
import { ApiError } from "../utils/apiError";

export interface CounselorFieldPayload {
  id: number;
  name: string;
  description: string | null;
}

export interface SessionPlanPublicPayload {
  id: number;
  duration: number;
  price: number;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CounselorPublicPayload {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  bio: string | null;
  totalSessions: number;
  fields: CounselorFieldPayload[];
  sessionPlans: SessionPlanPublicPayload[];
}

const serializePlan = (plan: {
  id: number;
  duration: number;
  price: any;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}): SessionPlanPublicPayload => ({
  id: plan.id,
  duration: plan.duration,
  price: Number(plan.price.toString()),
  quantity: plan.quantity,
  createdAt: plan.createdAt,
  updatedAt: plan.updatedAt,
});

export const getApprovedCounselors = async (fieldId?: number): Promise<CounselorPublicPayload[]> => {
  if (fieldId !== undefined) {
    const field = await prisma.field.findUnique({
      where: { id: fieldId },
      select: { id: true },
    });

    if (!field) {
      throw ApiError.notFound("Field not found");
    }
  }

  const where: any = {
    verificationStatus: "APPROVED",
    ...(fieldId !== undefined ? { fields: { some: { fieldId } } } : {}),
  };

  const profiles = await prisma.counselorProfile.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      sessionPlans: {
        select: {
          id: true,
          duration: true,
          price: true,
          quantity: true,
          createdAt: true,
          updatedAt: true,
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
    firstName: profile.user.firstName,
    lastName: profile.user.lastName,
    bio: profile.bio,
    totalSessions: profile.totalSessions,
    fields: profile.fields.map((cf) => ({
      id: cf.field.id,
      name: cf.field.name,
      description: cf.field.description,
    })),
    sessionPlans: profile.sessionPlans.map(serializePlan),
  }));
};

/** Helper to get or ensure counselor ID for a given user ID */
export const getCounselorRecord = async (userId: number) => {
  let counselor = await prisma.counselor.findUnique({
    where: { userId },
  });

  if (!counselor) {
    counselor = await prisma.counselor.create({
      data: {
        userId,
        specialization: "Licensed Psychological Counselling",
        hourlyRate: 50.0,
        isAvailable: true,
      },
    });
  }

  return counselor;
};

/** Get clients assigned to this counselor through appointments or sessions */
export const getCounselorClients = async (userId: number) => {
  const counselor = await getCounselorRecord(userId);

  // Clients with appointments
  const appointments = await prisma.appointment.findMany({
    where: { counselorId: counselor.id },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatar: true,
          createdAt: true,
          client: true,
        },
      },
      session: true,
    },
    orderBy: { date: "desc" },
  });

  // Clients with sessions
  const sessions = await prisma.session.findMany({
    where: { counselorId: counselor.id },
    include: {
      client: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              avatar: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  // Unique client map
  const clientsMap = new Map<number, any>();

  for (const appt of appointments) {
    if (!clientsMap.has(appt.user.id)) {
      clientsMap.set(appt.user.id, {
        id: appt.user.id,
        firstName: appt.user.firstName,
        lastName: appt.user.lastName,
        email: appt.user.email,
        phone: appt.user.phone,
        avatar: appt.user.avatar,
        registeredAt: appt.user.createdAt,
        emergencyContact: appt.user.client?.emergencyContact || null,
        gender: appt.user.client?.gender || null,
        appointmentCount: 1,
        lastAppointment: appt.date,
      });
    } else {
      const client = clientsMap.get(appt.user.id);
      client.appointmentCount += 1;
    }
  }

  for (const sess of sessions) {
    if (sess.client && sess.client.user) {
      if (!clientsMap.has(sess.client.user.id)) {
        clientsMap.set(sess.client.user.id, {
          id: sess.client.user.id,
          firstName: sess.client.user.firstName,
          lastName: sess.client.user.lastName,
          email: sess.client.user.email,
          phone: sess.client.user.phone,
          avatar: sess.client.user.avatar,
          registeredAt: sess.client.user.createdAt,
          emergencyContact: sess.client.emergencyContact || null,
          gender: sess.client.gender || null,
          appointmentCount: 0,
          lastAppointment: sess.createdAt,
        });
      }
    }
  }

  return Array.from(clientsMap.values());
};

/** Get appointments for this counselor */
export const getCounselorAppointments = async (userId: number) => {
  const counselor = await getCounselorRecord(userId);

  const appointments = await prisma.appointment.findMany({
    where: { counselorId: counselor.id },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      session: true,
    },
    orderBy: { date: "asc" },
  });

  return appointments;
};

/** Get counselling sessions for this counselor */
export const getCounselorSessions = async (userId: number) => {
  const counselor = await getCounselorRecord(userId);

  const sessions = await prisma.session.findMany({
    where: { counselorId: counselor.id },
    include: {
      client: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      },
      appointment: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return sessions;
};

/** Update session notes */
export const updateSessionNotes = async (
  userId: number,
  sessionId: number,
  notes: string
) => {
  const counselor = await getCounselorRecord(userId);

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw ApiError.notFound("Session not found");
  }

  if (session.counselorId !== counselor.id) {
    throw ApiError.forbidden("Not authorized to update notes for this session");
  }

  const updated = await prisma.session.update({
    where: { id: sessionId },
    data: { notes },
  });

  return updated;
};

/** Update session status */
export const updateSessionStatus = async (
  userId: number,
  sessionId: number,
  status: SessionStatus
) => {
  const counselor = await getCounselorRecord(userId);

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw ApiError.notFound("Session not found");
  }

  if (session.counselorId !== counselor.id) {
    throw ApiError.forbidden("Not authorized to update this session");
  }

  const updated = await prisma.session.update({
    where: { id: sessionId },
    data: { status },
  });

  return updated;
};

/** Get Counselor dashboard overview statistics */
export const getCounselorDashboardStats = async (userId: number) => {
  const counselor = await getCounselorRecord(userId);

  const [appointmentsCount, sessionsCount, completedSessionsCount] = await Promise.all([
    prisma.appointment.count({ where: { counselorId: counselor.id } }),
    prisma.session.count({ where: { counselorId: counselor.id } }),
    prisma.session.count({
      where: { counselorId: counselor.id, status: SessionStatus.COMPLETED },
    }),
  ]);

  const clients = await getCounselorClients(userId);

  return {
    totalClients: clients.length,
    totalAppointments: appointmentsCount,
    totalSessions: sessionsCount,
    completedSessions: completedSessionsCount,
    specialization: counselor.specialization,
    isAvailable: counselor.isAvailable,
  };
};

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
