import { UserRole, SessionStatus } from "@prisma/client";
import prisma from "../lib/prisma";
import { ApiError } from "../utils/apiError";

export const getClientProfile = async (userId: number) => {
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
      client: true,
    },
  });

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  return user;
};

export const updateClientProfile = async (
  userId: number,
  data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    emergencyContact?: string;
    gender?: string;
    dateOfBirth?: string;
  }
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  const userUpdateData: { firstName?: string; lastName?: string; phone?: string | null } = {};
  if (data.firstName !== undefined) userUpdateData.firstName = data.firstName;
  if (data.lastName !== undefined) userUpdateData.lastName = data.lastName;
  if (data.phone !== undefined) userUpdateData.phone = data.phone || null;

  const updatedUser = await prisma.$transaction(async (tx) => {
    if (Object.keys(userUpdateData).length > 0) {
      await tx.user.update({
        where: { id: userId },
        data: userUpdateData,
      });
    }

    if (data.emergencyContact !== undefined || data.gender !== undefined || data.dateOfBirth !== undefined) {
      await tx.client.upsert({
        where: { userId },
        update: {
          emergencyContact: data.emergencyContact || null,
          gender: data.gender || null,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        },
        create: {
          userId,
          emergencyContact: data.emergencyContact || null,
          gender: data.gender || null,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        },
      });
    }

    return tx.user.findUnique({
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
        client: true,
      },
    });
  });

  return updatedUser;
};

export const getAvailableCounselors = async () => {
  const counselors = await prisma.counselor.findMany({
    where: { isAvailable: true },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatar: true,
        },
      },
      availabilities: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Also query counselor profiles if any exist
  const profiles = await prisma.counselorProfile.findMany({
    where: { verificationStatus: "APPROVED" },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatar: true,
        },
      },
      fields: {
        include: { field: true },
      },
      sessionPlans: true,
    },
  });

  return {
    counselors,
    verifiedProfiles: profiles,
  };
};

export const getClientAppointments = async (userId: number) => {
  const appointments = await prisma.appointment.findMany({
    where: { userId },
    include: {
      counselor: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              avatar: true,
            },
          },
        },
      },
      session: true,
    },
    orderBy: { date: "desc" },
  });

  return appointments;
};

export const bookClientAppointment = async (
  userId: number,
  data: {
    counselorId: number;
    date: string;
    startTime: string;
    endTime: string;
    type: string;
    notes?: string;
  }
) => {
  // Validate counselor exists
  const counselor = await prisma.counselor.findUnique({
    where: { id: data.counselorId },
  });

  let effectiveCounselorId = data.counselorId;

  if (!counselor) {
    // Check if counselorId was passed as a User ID of a counselor
    const counselorByUser = await prisma.counselor.findUnique({
      where: { userId: data.counselorId },
    });
    if (counselorByUser) {
      effectiveCounselorId = counselorByUser.id;
    } else {
      // Create a default counselor record for this user if they have COUNSELOR role
      const user = await prisma.user.findUnique({ where: { id: data.counselorId } });
      if (user && user.role === UserRole.COUNSELOR) {
        const createdCounselor = await prisma.counselor.create({
          data: {
            userId: user.id,
            specialization: "General Counselling",
            hourlyRate: 50.0,
            isAvailable: true,
          },
        });
        effectiveCounselorId = createdCounselor.id;
      } else {
        throw ApiError.badRequest("Selected counselor was not found");
      }
    }
  }

  // Ensure client record exists
  await prisma.client.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  const clientRecord = await prisma.client.findUnique({ where: { userId } });

  const appointment = await prisma.$transaction(async (tx) => {
    const createdAppointment = await tx.appointment.create({
      data: {
        userId,
        counselorId: effectiveCounselorId,
        date: new Date(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        type: data.type || "Online Counselling",
        notes: data.notes || null,
      },
      include: {
        counselor: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (clientRecord) {
      await tx.session.create({
        data: {
          clientId: clientRecord.id,
          counselorId: effectiveCounselorId,
          appointmentId: createdAppointment.id,
          status: SessionStatus.SCHEDULED,
          notes: data.notes || null,
        },
      });
    }

    return createdAppointment;
  });

  return appointment;
};

export const cancelClientAppointment = async (userId: number, appointmentId: number) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment) {
    throw ApiError.notFound("Appointment not found");
  }

  if (appointment.userId !== userId) {
    throw ApiError.forbidden("You are not authorized to cancel this appointment");
  }

  await prisma.$transaction(async (tx) => {
    await tx.session.deleteMany({
      where: { appointmentId },
    });
    await tx.appointment.delete({
      where: { id: appointmentId },
    });
  });

  return { message: "Appointment cancelled successfully" };
};

export const getClientSessions = async (userId: number) => {
  const client = await prisma.client.findUnique({ where: { userId } });
  if (!client) {
    return [];
  }

  const sessions = await prisma.session.findMany({
    where: { clientId: client.id },
    include: {
      counselor: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
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
