import axiosInstance from './axiosInstance';
import { Grade, ExamScore } from '../types';

export interface UpsertGradeData {
  subject: string;
  year: number;
  quarter1?: number;
  quarter2?: number;
  quarter3?: number;
  quarter4?: number;
  yearScore?: number;
  examScore?: string;
  finalScore?: number;
}

export interface CreateExamData {
  examType: string;
  subject: string;
  score: number;
  year: number;
}

export const gradesApi = {
  getAll: async (): Promise<{ grades: Grade[] }> => {
    const response = await axiosInstance.get('/grades');
    return response.data;
  },
  upsert: async (data: UpsertGradeData): Promise<{ grade: Grade }> => {
    const response = await axiosInstance.post('/grades', data);
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
  getExams: async (): Promise<{ exams: ExamScore[] }> => {
    const response = await axiosInstance.get('/grades/exams');
    return response.data;
  },
  createExam: async (data: CreateExamData): Promise<{ exam: ExamScore }> => {
    const response = await axiosInstance.post('/grades/exams', data);
    return response.data;
  },
  deleteExam: async (id: string): Promise<{ message: string }> => {
    const response = await axiosInstance.delete(`/grades/exams/${id}`);
    return response.data;
  },
};
