import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import {
  askNavigator, getChatHistory,
  computeInitialCRI, tryRecalcCRI, getSavedCRI,
  buildUserProfile,
} from '../services/ai.service';

export const ask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { question } = req.body;
    if (!question?.trim()) { res.status(400).json({ error: 'Задайте вопрос' }); return; }
    const answer = await askNavigator({ question: question.trim(), userId: req.user!.userId });
    res.status(200).json({ answer });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Ошибка AI' });
  }
};

export const getHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const history = await getChatHistory(req.user!.userId);
    res.status(200).json({ history });
  } catch {
    res.status(500).json({ error: 'Ошибка получения истории' });
  }
};

export const getLoadCRI = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cri = await getSavedCRI(req.user!.userId);
    res.status(200).json({ cri });
  } catch {
    res.status(500).json({ error: 'Ошибка загрузки CRI' });
  }
};

export const calcInitialCRI = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    // Логируем профиль для отладки
    const { profileText } = await buildUserProfile(userId);
    console.log('[CRI Debug] Profile sent to AI:\n', profileText);

    const cri = await computeInitialCRI(userId);
    res.status(200).json({ cri });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Ошибка CRI' });
  }
};

export const recalcCRI = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { changes } = req.body;
    if (!changes?.trim()) { res.status(400).json({ error: 'Укажите что изменилось' }); return; }
    const result = await tryRecalcCRI(req.user!.userId, changes);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Ошибка пересчёта' });
  }
};
