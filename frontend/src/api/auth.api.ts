import axiosInstance from './axiosInstance';
import { RegisterFormData, LoginFormData, User } from '../types';

export const authApi = {
  register: async (data: RegisterFormData): Promise<{ user: User; token: string }> => {
    const response = await axiosInstance.post('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginFormData): Promise<{ user: User; token: string }> => {
    const response = await axiosInstance.post('/auth/login', data);
    return response.data;
  },

  getMe: async (): Promise<{ user: User }> => {
    const response = await axiosInstance.get('/auth/me');
    return response.data;
  },
};
