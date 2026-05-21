import axiosInstance from './axiosInstance';
import { ChatMessage } from '../types';

export const aiApi = {
  ask: async (question: string): Promise<{ answer: string }> => {
    const response = await axiosInstance.post('/ai/ask', { question });
    return response.data;
  },
  getHistory: async (): Promise<{ history: ChatMessage[] }> => {
    const response = await axiosInstance.get('/ai/history');
    return response.data;
  },
  loadCRI: async (): Promise<{ cri: number | null }> => {
    const response = await axiosInstance.get('/ai/cri');
    return response.data;
  },
  calcInitialCRI: async (): Promise<{ cri: number }> => {
    const response = await axiosInstance.post('/ai/cri/initial');
    return response.data;
  },
  recalcCRI: async (changes: string): Promise<{ newCRI: number; changed: boolean; reason: string }> => {
    const response = await axiosInstance.post('/ai/cri/recalc', { changes });
    return response.data;
  },
};
