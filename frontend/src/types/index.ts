export type UserRole = "CLIENT" | "COUNSELOR" | "ADMIN";

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: UserRole;
  avatar?: string | null;
  createdAt?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: UserRole;
}

export interface Counselor {
  id: number;
  userId: number;
  specialization: string;
  bio?: string;
  licenseNumber?: string;
  hourlyRate: number;
  isAvailable: boolean;
  user: User;
}

export interface Appointment {
  id: number;
  userId: number;
  counselorId: number;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  notes?: string;
  counselor?: Counselor;
  user?: User;
}

export interface Session {
  id: number;
  clientId: number;
  counselorId: number;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  notes?: string;
  startTime?: string;
  endTime?: string;
  createdAt?: string;
  client?: {
    id: number;
    user: User;
  };
  counselor?: {
    id: number;
    user: User;
  };
  appointment?: Appointment;
}

export interface SystemAnalytics {
  users: {
    total: number;
    clients: number;
    counselors: number;
    admins: number;
  };
  appointments: {
    total: number;
  };
  sessions: {
    total: number;
    scheduled: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  };
  counselorVerifications: {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  };
  recentUsers: Array<{
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    createdAt: string;
  }>;
}

export interface SystemConfig {
  platformName: string;
  allowClientRegistration: boolean;
  defaultUserRole: string;
  bootstrapAdmin: string;
  sessionDurationOptions: number[];
  requireCounselorVerification: boolean;
  telehealthEnabled: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
