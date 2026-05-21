export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  schoolGrade: number;
  city?: string;
  hobbies?: string;
  achievements?: string;
  characteristic?: string;
  createdAt: string;
}

export interface Grade {
  id: string;
  userId: string;
  subject: string;
  quarter1?: number;
  quarter2?: number;
  quarter3?: number;
  quarter4?: number;
  yearScore?: number;
  examScore?: string;
  finalScore?: number;
  year: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExamScore {
  id: string;
  userId: string;
  examType: string;
  subject: string;
  score: number;
  year: number;
  createdAt: string;
}

export interface GradeGrouped {
  subject: string;
  average: number;
  grades: Grade[];
}

export interface CareerProfile {
  id: string;
  userId: string;
  desiredSphere?: string;
  desiredUniversity?: string;
  cri?: number;
  criBreakdown?: unknown;
  trackerPlan?: unknown;
}

export interface GradeInput {
  subject: string;
  quarter1?: number;
  quarter2?: number;
  quarter3?: number;
  quarter4?: number;
  yearScore?: number;
  examScore?: string;
  finalScore?: number;
}

export interface ExamInput {
  examType: string;
  subject: string;
  score: number;
}

export interface RegisterFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  schoolGrade: number;
  city?: string;
  hobbies?: string;
  achievements?: string;
  characteristic?: string;
  grades?: GradeInput[];
  examScores?: ExamInput[];
}

export interface LoginFormData {
  email: string;
  password: string;
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
  examScores: ExamScore[];
  isLoading: boolean;
  error: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}
