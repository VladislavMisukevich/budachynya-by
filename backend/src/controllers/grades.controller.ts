import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import {
  upsertGrade, getGradesByUser, deleteGrade, getSubjectsByGrade,
} from '../services/grades.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const upsertGradeHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { subject, year, quarter1, quarter2, quarter3, quarter4, yearScore, examScore, finalScore } = req.body;
    if (!subject || !year) { res.status(400).json({ error: 'Укажите предмет и год' }); return; }
    const grade = await upsertGrade(userId, {
      subject, year: Number(year),
      quarter1: quarter1 !== undefined ? Number(quarter1) : undefined,
      quarter2: quarter2 !== undefined ? Number(quarter2) : undefined,
      quarter3: quarter3 !== undefined ? Number(quarter3) : undefined,
      quarter4: quarter4 !== undefined ? Number(quarter4) : undefined,
      yearScore: yearScore !== undefined ? Number(yearScore) : undefined,
      examScore: examScore || undefined,
      finalScore: finalScore !== undefined ? Number(finalScore) : undefined,
    });
    res.status(200).json({ grade });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка';
    res.status(400).json({ error: message });
  }
};

export const getGrades = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const grades = await getGradesByUser(userId);
    res.status(200).json({ grades });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения оценок' });
  }
};

export const removeGrade = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const id = String(req.params.id);
    const result = await deleteGrade(userId, id);
    res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка';
    res.status(400).json({ error: message });
  }
};

export const getSubjectsHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { schoolGrade: true } });
  const subjects = getSubjectsByGrade(user?.schoolGrade || 11);
  res.status(200).json({ subjects });
};

export const upsertExamScore = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { examType, subject, score, year } = req.body;
    if (!examType || !subject || score === undefined || !year) {
      res.status(400).json({ error: 'Заполните все поля' }); return;
    }
    if (Number(score) < 0 || Number(score) > 100) {
      res.status(400).json({ error: 'Балл ЦЭ/ЦТ от 0 до 100' }); return;
    }
    const exam = await prisma.examScore.upsert({
      where: { id: 'placeholder' },
      create: { userId, examType, subject, score: Number(score), year: Number(year) },
      update: { score: Number(score) },
    });
    res.status(200).json({ exam });
  } catch {
    res.status(500).json({ error: 'Ошибка сохранения' });
  }
};

export const createExamScore = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { examType, subject, score, year } = req.body;
    if (!examType || !subject || score === undefined || !year) {
      res.status(400).json({ error: 'Заполните все поля' }); return;
    }
    if (Number(score) < 0 || Number(score) > 100) {
      res.status(400).json({ error: 'Балл ЦЭ/ЦТ от 0 до 100' }); return;
    }
    const exam = await prisma.examScore.create({
      data: { userId, examType, subject, score: Number(score), year: Number(year) },
    });
    res.status(201).json({ exam });
  } catch {
    res.status(500).json({ error: 'Ошибка сохранения' });
  }
};

export const getExamScores = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const exams = await prisma.examScore.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ exams });
  } catch {
    res.status(500).json({ error: 'Ошибка' });
  }
};

export const deleteExamScore = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const id = String(req.params.id);
    const exam = await prisma.examScore.findUnique({ where: { id } });
    if (!exam || exam.userId !== userId) { res.status(404).json({ error: 'Не найдено' }); return; }
    await prisma.examScore.delete({ where: { id } });
    res.status(200).json({ message: 'Удалено' });
  } catch {
    res.status(500).json({ error: 'Ошибка' });
  }
};
