import axiosInstance from './axiosInstance';
import { Grade, GradeGrouped } from '../types';

export interface GradesResponse {
  grades: Grade[];
  grouped: GradeGrouped[];
}

export interface CreateGradeData {
  subject: string;
  score: number;
  quarter?: number;
  year: number;
}

export interface UpdateGradeData {
  subject?: string;
  score?: number;
  quarter?: number;
  year?: number;
}

export const gradesApi = {
  getAll: async (): Promise<GradesResponse> => {
    const response = await axiosInstance.get('/grades');
    return response.data;
  },

  create: async (data: CreateGradeData): Promise<{ grade: Grade }> => {
    const response = await axiosInstance.post('/grades', data);
    return response.data;
  },

  update: async (id: string, data: UpdateGradeData): Promise<{ grade: Grade }> => {
    const response = await axiosInstance.put(`/grades/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await axiosInstance.delete(`/grades/${id}`);
    return response.data;
  },

  getSubjects: async (): Promise<{ subjects: string[] }> => {
    const response = await axiosInstance.get('/grades/subjects');
    return response.data;
  },
};
