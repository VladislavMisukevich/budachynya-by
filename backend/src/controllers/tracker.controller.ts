import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { generateTrackerPlan, getTrackerPlan, toggleStep } from '../services/tracker.service';

export const generate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { desiredSphere, desiredUniversity } = req.body;
    const plan = await generateTrackerPlan(userId, desiredSphere, desiredUniversity);
    res.status(200).json({ plan });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Ошибка генерации' });
  }
};

export const getPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const plan = await getTrackerPlan(req.user!.userId);
    res.status(200).json({ plan });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка загрузки плана' });
  }
};

export const toggle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const stepIndex = parseInt(String(req.params.index));
    if (isNaN(stepIndex)) { res.status(400).json({ error: 'Неверный индекс' }); return; }
    const plan = await toggleStep(userId, stepIndex);
    res.status(200).json({ plan });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Ошибка' });
  }
};
