import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { askNavigator, getChatHistory } from '../services/ai.service';

export const ask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { question } = req.body;

    if (!question || question.trim().length === 0) {
      res.status(400).json({ error: 'Задайте вопрос' });
      return;
    }

    if (question.length > 1000) {
      res.status(400).json({ error: 'Вопрос слишком длинный (максимум 1000 символов)' });
      return;
    }

    const answer = await askNavigator({ question: question.trim(), userId });
    res.status(200).json({ answer });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка AI-навигатора';
    res.status(500).json({ error: message });
  }
};

export const getHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const history = await getChatHistory(userId);
    res.status(200).json({ history });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка получения истории';
    res.status(500).json({ error: message });
  }
};
