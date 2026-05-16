export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  schoolGrade: number;
  city?: string;
  createdAt: string;
}

export interface Grade {
  id: string;
  userId: string;
  subject: string;
  score: number;
  quarter?: number;
  year: number;
  createdAt: string;
  updatedAt: string;
}

export interface GradeGrouped {
  subject: string;
  average: number;
  grades: Grade[];
}

export interface CareerProfile {
  id: string;
  userId: string;
  desiredSphere: string;
  desiredUniversity?: string;
  cri?: number;
  trackerPlan?: unknown;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface GradesState {
  grades: Grade[];
  grouped: GradeGrouped[];
  isLoading: boolean;
  error: string | null;
}

export interface RegisterFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  schoolGrade: number;
  city?: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}
