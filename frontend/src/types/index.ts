export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: "CLIENT" | "COUNSELOR" | "ADMIN";
  avatar?: string;
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
}

export interface Session {
  id: number;
  clientId: number;
  counselorId: number;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  notes?: string;
  startTime?: string;
  endTime?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
