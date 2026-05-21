import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const SUBJECTS_BY_GRADE: Record<number, string[]> = {
  9: [
    'Белорусский язык', 'Белорусская литература',
    'Русский язык', 'Русская литература',
    'Английский язык', 'Математика',
    'История Беларуси', 'Всемирная история',
    'Обществоведение', 'География', 'Биология',
    'Физика', 'Химия', 'Информатика',
    'Трудовое обучение', 'Физкультура', 'ОБЖ',
  ],
  10: [
    'Белорусский язык', 'Белорусская литература',
    'Русский язык', 'Русская литература',
    'Английский язык', 'Математика',
    'История Беларуси', 'Всемирная история',
    'Обществоведение', 'География', 'Биология',
    'Физика', 'Химия', 'Информатика',
    'Физкультура', 'ОБЖ',
  ],
  11: [
    'Белорусский язык', 'Белорусская литература',
    'Русский язык', 'Русская литература',
    'Английский язык', 'Математика',
    'История Беларуси', 'Всемирная история',
    'Обществоведение', 'География', 'Биология',
    'Физика', 'Химия', 'Информатика',
    'Физкультура', 'ОБЖ',
  ],
};

export interface UpsertGradeDto {
  subject: string;
  year: number;
  quarter1?: number;
  quarter2?: number;
  quarter3?: number;
  quarter4?: number;
  yearScore?: number;
  examScore?: string;
  finalScore?: number;
}

const validateScore = (s: number | undefined) => {
  if (s !== undefined && (s < 1 || s > 10)) throw new Error('Оценка должна быть от 1 до 10');
};

export const upsertGrade = async (userId: string, dto: UpsertGradeDto) => {
  validateScore(dto.quarter1);
  validateScore(dto.quarter2);
  validateScore(dto.quarter3);
  validateScore(dto.quarter4);
  validateScore(dto.yearScore);
  validateScore(dto.finalScore);

  return prisma.grade.upsert({
    where: { userId_subject_year: { userId, subject: dto.subject, year: dto.year } },
    create: { userId, ...dto },
    update: { ...dto },
  });
};

export const getGradesByUser = async (userId: string) => {
  return prisma.grade.findMany({ where: { userId }, orderBy: { subject: 'asc' } });
};

export const deleteGrade = async (userId: string, gradeId: string) => {
  const grade = await prisma.grade.findUnique({ where: { id: gradeId } });
  if (!grade) throw new Error('Оценка не найдена');
  if (grade.userId !== userId) throw new Error('Нет доступа');
  await prisma.grade.delete({ where: { id: gradeId } });
  return { message: 'Удалено' };
};

export const getSubjectsByGrade = (schoolGrade: number): string[] => {
  if (schoolGrade <= 9) return SUBJECTS_BY_GRADE[9];
  if (schoolGrade === 10) return SUBJECTS_BY_GRADE[10];
  return SUBJECTS_BY_GRADE[11];
};
