import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { signToken } from '../utils/jwt.utils';

const prisma = new PrismaClient();

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  schoolGrade: number;
  city?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export const registerUser = async (dto: RegisterDto) => {
  const existing = await prisma.user.findUnique({
    where: { email: dto.email },
  });

  if (existing) {
    throw new Error('Пользователь с таким email уже существует');
  }

  if (dto.schoolGrade < 1 || dto.schoolGrade > 11) {
    throw new Error('Класс должен быть от 1 до 11');
  }

  const passwordHash = await bcrypt.hash(dto.password, 12);

  const user = await prisma.user.create({
    data: {
      email: dto.email.toLowerCase().trim(),
      passwordHash,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      schoolGrade: dto.schoolGrade,
      city: dto.city?.trim(),
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      schoolGrade: true,
      city: true,
      createdAt: true,
    },
  });

  const token = signToken({ userId: user.id, email: user.email });

  return { user, token };
};

export const loginUser = async (dto: LoginDto) => {
  const user = await prisma.user.findUnique({
    where: { email: dto.email.toLowerCase().trim() },
  });

  if (!user) {
    throw new Error('Неверный email или пароль');
  }

  const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new Error('Неверный email или пароль');
  }

  const token = signToken({ userId: user.id, email: user.email });

  const { passwordHash: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, token };
};

export const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      schoolGrade: true,
      city: true,
      createdAt: true,
      grades: true,
      careerProfile: true,
    },
  });

  if (!user) {
    throw new Error('Пользователь не найден');
  }

  return user;
};
