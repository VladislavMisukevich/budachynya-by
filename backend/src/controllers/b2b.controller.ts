import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { getContracts, applyContract, getMyApplications } from '../services/b2b.service';

export const listContracts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const contracts = await getContracts(req.user!.userId);
    res.status(200).json({ contracts });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Ошибка' });
  }
};

export const apply = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const contractId = String(req.params.id);
    const { message } = req.body;
    const application = await applyContract(userId, contractId, message);
    res.status(201).json({ application });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка';
    res.status(400).json({ error: message });
  }
};

export const myApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const apps = await getMyApplications(req.user!.userId);
    res.status(200).json({ applications: apps });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка' });
  }
};
