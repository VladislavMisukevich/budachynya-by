import axiosInstance from './axiosInstance';

export interface Company {
  id: string;
  name: string;
  industry: string;
  city: string;
  description: string;
  website?: string;
}

export interface Contract {
  id: string;
  companyId: string;
  title: string;
  specialty: string;
  university: string;
  description: string;
  requirements: string[];
  benefits: string[];
  minCRI: number;
  minGrade: number;
  slotsTotal: number;
  slotsTaken: number;
  deadline: string;
  isActive: boolean;
  company: Company;
  isApplied: boolean;
  applicationStatus: string | null;
  isEligible: boolean;
  userCRI: number;
  userAvgGrade: number;
}

export interface Application {
  id: string;
  status: string;
  message?: string;
  createdAt: string;
  contract: Contract & { company: Company };
}

export const b2bApi = {
  getContracts: async (): Promise<{ contracts: Contract[] }> => {
    const response = await axiosInstance.get('/b2b');
    return response.data;
  },
  apply: async (contractId: string, message?: string): Promise<{ application: Application }> => {
    const response = await axiosInstance.post(`/b2b/${contractId}/apply`, { message });
    return response.data;
  },
  getMyApplications: async (): Promise<{ applications: Application[] }> => {
    const response = await axiosInstance.get('/b2b/my');
    return response.data;
  },
};
