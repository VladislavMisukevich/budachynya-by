import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import {
  createGrade,
  getGradesByUser,
  updateGrade,
  deleteGrade,
  getValidSubjects,
} from '../services/grades.service';

export const addGrade = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { subject, score, quarter, year } = req.body;

    if (!subject || score === undefined || !year) {
      res.status(400).json({ error: 'Укажите предмет, оценку и год' });
      return;
    }

    const grade = await createGrade(userId, {
      subject,
      score: Number(score),
      quarter: quarter ? Number(quarter) : undefined,
      year: Number(year),
    });

    res.status(201).json({ message: 'Оценка добавлена', grade });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка добавления оценки';
    res.status(400).json({ error: message });
  }
};

export const getGrades = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const result = await getGradesByUser(userId);
    res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка получения оценок';
    res.status(500).json({ error: message });
  }
};

export const editGrade = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const id = String(req.params.id);
    const { subject, score, quarter, year } = req.body;

    const updated = await updateGrade(userId, id, {
      subject,
      score: score !== undefined ? Number(score) : undefined,
      quarter: quarter !== undefined ? Number(quarter) : undefined,
      year: year !== undefined ? Number(year) : undefined,
    });

    res.status(200).json({ message: 'Оценка обновлена', grade: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка обновления оценки';
    res.status(400).json({ error: message });
  }
};

export const removeGrade = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const id = String(req.params.id);

    const result = await deleteGrade(userId, id);
    res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка удаления оценки';
    res.status(400).json({ error: message });
  }
};

export const getSubjects = async (_req: AuthRequest, res: Response): Promise<void> => {
  const subjects = getValidSubjects();
  res.status(200).json({ subjects });
};
