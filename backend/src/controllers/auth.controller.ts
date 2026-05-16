import { Request, Response } from 'express';
import { registerUser, loginUser, getUserById } from '../services/auth.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, schoolGrade, city } = req.body;

    if (!email || !password || !firstName || !lastName || !schoolGrade) {
      res.status(400).json({ error: 'Заполните все обязательные поля' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' });
      return;
    }

    const result = await registerUser({
      email,
      password,
      firstName,
      lastName,
      schoolGrade: Number(schoolGrade),
      city,
    });

    res.status(201).json({
      message: 'Регистрация прошла успешно',
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка регистрации';
    res.status(400).json({ error: message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Введите email и пароль' });
      return;
    }

    const result = await loginUser({ email, password });

    res.status(200).json({
      message: 'Вход выполнен успешно',
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка входа';
    res.status(401).json({ error: message });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    const user = await getUserById(userId);
    res.status(200).json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка получения профиля';
    res.status(404).json({ error: message });
  }
};
