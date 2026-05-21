import { PrismaClient } from '@prisma/client';
import { searchSimilar, seedKnowledge } from './vectorStore.service';
import { generateAnswer, computeCRIWithAI, recalcCRIStrict } from './gemini.service';

const prisma = new PrismaClient();
let isSeeded = false;

export const ensureKnowledgeSeeded = async () => {
  if (!isSeeded) { await seedKnowledge(); isSeeded = true; }
};

export const buildUserProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { grades: true, examScores: true, careerProfile: true },
  });
  if (!user) throw new Error('Пользователь не найден');

  const gradesText = user.grades.length
    ? user.grades.map(g => {
        const parts: string[] = [];
        if (g.quarter1) parts.push(`1ч:${g.quarter1}`);
        if (g.quarter2) parts.push(`2ч:${g.quarter2}`);
        if (g.quarter3) parts.push(`3ч:${g.quarter3}`);
        if (g.quarter4) parts.push(`4ч:${g.quarter4}`);
        if (g.yearScore) parts.push(`год:${g.yearScore}`);
        if (g.examScore) parts.push(`экз:${g.examScore}`);
        if (g.finalScore) parts.push(`итог:${g.finalScore}`);
        return `  ${g.subject}: ${parts.join(', ')}`;
      }).join('\n')
    : '  не внесены';

  const examsText = user.examScores.length
    ? user.examScores.map(e => `  ${e.examType} ${e.subject}: ${e.score}/100`).join('\n')
    : '  не внесены';

  // Считаем средний по всем доступным оценкам (не только итоговым)
  const allScores: number[] = [];
  for (const g of user.grades) {
    const best = g.finalScore || g.yearScore ||
      [g.quarter4, g.quarter3, g.quarter2, g.quarter1]
        .find(q => q !== null && q !== undefined);
    if (best) allScores.push(best as number);
    else {
      // Если нет итоговой — берём среднее по четвертям
      const quarters = [g.quarter1, g.quarter2, g.quarter3, g.quarter4]
        .filter((q): q is number => q !== null && q !== undefined);
      if (quarters.length > 0) {
        allScores.push(quarters.reduce((a, b) => a + b, 0) / quarters.length);
      }
    }
  }

  const avgScore = allScores.length
    ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;

  return {
    user,
    avgScore,
    profileText: `Имя: ${user.firstName} ${user.lastName}
Класс: ${user.schoolGrade}
Город: ${user.city || 'не указан'}
Средний балл: ${avgScore > 0 ? avgScore.toFixed(1) : '0'} из 10
Количество предметов с оценками: ${user.grades.length} из 16
Увлечения: ${user.hobbies || 'не указаны'}
Достижения: ${user.achievements || 'не указаны'}
Характеристика: ${user.characteristic || 'не указана'}
Оценки по предметам:
${gradesText}
Результаты ЦЭ/ЦТ/РТ:
${examsText}`.trim(),
  };
};

export const askNavigator = async ({ question, userId }: { question: string; userId: string }) => {
  await ensureKnowledgeSeeded();
  const { user, profileText } = await buildUserProfile(userId);
  const chunks = await searchSimilar(question, 4);
  const context = chunks.join('\n\n---\n\n');
  const answer = await generateAnswer(question, context, profileText, {
    firstName: user.firstName,
    schoolGrade: user.schoolGrade,
    city: user.city ?? undefined,
  });
  await prisma.chatMessage.createMany({
    data: [
      { userId, role: 'user', content: question },
      { userId, role: 'assistant', content: answer },
    ],
  });
  return answer;
};

export const computeInitialCRI = async (userId: string): Promise<number> => {
  const { profileText } = await buildUserProfile(userId);
  const cri = await computeCRIWithAI(profileText);

  await prisma.careerProfile.upsert({
    where: { userId },
    create: {
      userId, cri,
      criBreakdown: { initial: true, calculatedAt: new Date().toISOString() },
      updatedAt: new Date(),
    },
    update: {
      cri,
      criBreakdown: { recalculated: true, calculatedAt: new Date().toISOString() },
      updatedAt: new Date(),
    },
  });

  return cri;
};

export const tryRecalcCRI = async (
  userId: string,
  changes: string
): Promise<{ newCRI: number; changed: boolean; reason: string }> => {
  const { profileText } = await buildUserProfile(userId);
  const profile = await prisma.careerProfile.findUnique({ where: { userId } });
  const currentCRI = profile?.cri ?? 0;

  const result = await recalcCRIStrict(profileText, currentCRI, changes);

  if (result.changed) {
    await prisma.careerProfile.upsert({
      where: { userId },
      create: { userId, cri: result.newCRI, updatedAt: new Date() },
      update: { cri: result.newCRI, updatedAt: new Date() },
    });
  }

  return result;
};

export const getSavedCRI = async (userId: string): Promise<number | null> => {
  const profile = await prisma.careerProfile.findUnique({ where: { userId } });
  if (!profile) return null;
  return profile.cri ?? null;
};

export const getChatHistory = async (userId: string) => {
  return prisma.chatMessage.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });
};
