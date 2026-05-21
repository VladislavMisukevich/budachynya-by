import axiosInstance from './axiosInstance';
import { User } from '../types';

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

export interface RegisterData {
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

export const authApi = {
  register: async (data: RegisterData): Promise<{ user: User; token: string }> => {
    const response = await axiosInstance.post('/auth/register', data);
    return response.data;
  },
  login: async (data: { email: string; password: string }): Promise<{ user: User; token: string }> => {
    const response = await axiosInstance.post('/auth/login', data);
    return response.data;
  },
  getMe: async (): Promise<{ user: User }> => {
    const response = await axiosInstance.get('/auth/me');
    return response.data;
  },
  updateProfile: async (data: {
    hobbies?: string;
    achievements?: string;
    characteristic?: string;
    city?: string;
  }): Promise<{ user: User }> => {
    const response = await axiosInstance.put('/auth/profile', data);
    return response.data;
  },
};
