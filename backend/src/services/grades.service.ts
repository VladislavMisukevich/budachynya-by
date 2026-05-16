import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateGradeDto {
  subject: string;
  score: number;
  quarter?: number;
  year: number;
}

export interface UpdateGradeDto {
  subject?: string;
  score?: number;
  quarter?: number;
  year?: number;
}

const VALID_SUBJECTS = [
  'Математика',
  'Алгебра',
  'Геометрия',
  'Физика',
  'Химия',
  'Биология',
  'История',
  'География',
  'Русский язык',
  'Белорусский язык',
  'Литература',
  'Английский язык',
  'Информатика',
  'Обществоведение',
  'Физкультура',
  'Труд',
];

export const createGrade = async (userId: string, dto: CreateGradeDto) => {
  if (dto.score < 1 || dto.score > 10) {
    throw new Error('Оценка должна быть от 1 до 10');
  }

  if (dto.quarter && (dto.quarter < 1 || dto.quarter > 4)) {
    throw new Error('Четверть должна быть от 1 до 4');
  }

  const currentYear = new Date().getFullYear();
  if (dto.year < 2020 || dto.year > currentYear + 1) {
    throw new Error(`Год должен быть от 2020 до ${currentYear + 1}`);
  }

  const grade = await prisma.grade.create({
    data: {
      userId,
      subject: dto.subject.trim(),
      score: dto.score,
      quarter: dto.quarter,
      year: dto.year,
    },
  });

  return grade;
};

export const getGradesByUser = async (userId: string) => {
  const grades = await prisma.grade.findMany({
    where: { userId },
    orderBy: [{ year: 'desc' }, { subject: 'asc' }],
  });

  const grouped = grades.reduce(
    (acc, grade) => {
      const key = grade.subject;
      if (!acc[key]) acc[key] = [];
      acc[key].push(grade);
      return acc;
    },
    {} as Record<string, typeof grades>
  );

  const averages = Object.entries(grouped).map(([subject, subjectGrades]) => {
    const avg =
      subjectGrades.reduce((sum, g) => sum + g.score, 0) / subjectGrades.length;
    return {
      subject,
      average: Math.round(avg * 10) / 10,
      grades: subjectGrades,
    };
  });

  return { grades, grouped: averages };
};

export const updateGrade = async (
  userId: string,
  gradeId: string,
  dto: UpdateGradeDto
) => {
  const existing = await prisma.grade.findUnique({
    where: { id: gradeId },
  });

  if (!existing) {
    throw new Error('Оценка не найдена');
  }

  if (existing.userId !== userId) {
    throw new Error('Нет доступа к этой оценке');
  }

  if (dto.score !== undefined && (dto.score < 1 || dto.score > 10)) {
    throw new Error('Оценка должна быть от 1 до 10');
  }

  if (dto.quarter !== undefined && (dto.quarter < 1 || dto.quarter > 4)) {
    throw new Error('Четверть должна быть от 1 до 4');
  }

  const updated = await prisma.grade.update({
    where: { id: gradeId },
    data: {
      ...(dto.subject && { subject: dto.subject.trim() }),
      ...(dto.score !== undefined && { score: dto.score }),
      ...(dto.quarter !== undefined && { quarter: dto.quarter }),
      ...(dto.year !== undefined && { year: dto.year }),
    },
  });

  return updated;
};

export const deleteGrade = async (userId: string, gradeId: string) => {
  const existing = await prisma.grade.findUnique({
    where: { id: gradeId },
  });

  if (!existing) {
    throw new Error('Оценка не найдена');
  }

  if (existing.userId !== userId) {
    throw new Error('Нет доступа к этой оценке');
  }

  await prisma.grade.delete({ where: { id: gradeId } });

  return { message: 'Оценка удалена' };
};

export const getValidSubjects = () => VALID_SUBJECTS;
