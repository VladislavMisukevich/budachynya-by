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
};
