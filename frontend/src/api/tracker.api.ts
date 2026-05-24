import axiosInstance from './axiosInstance';
import { TrackerPlan } from '../types/tracker';

export const trackerApi = {
  get: async (): Promise<{ plan: TrackerPlan | null }> => {
    const response = await axiosInstance.get('/tracker');
    return response.data;
  },
  generate: async (desiredSphere?: string, desiredUniversity?: string): Promise<{ plan: TrackerPlan }> => {
    const response = await axiosInstance.post('/tracker/generate', { desiredSphere, desiredUniversity });
    return response.data;
  },
  toggleStep: async (index: number): Promise<{ plan: TrackerPlan }> => {
    const response = await axiosInstance.patch(`/tracker/steps/${index}/toggle`);
    return response.data;
  },
};
