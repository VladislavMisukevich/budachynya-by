import { PrismaClient } from '@prisma/client';
import { searchSimilar, seedKnowledge } from './vectorStore.service';
import { generateAnswer } from './gemini.service';

const prisma = new PrismaClient();

let isSeeded = false;

export const ensureKnowledgeSeeded = async (): Promise<void> => {
  if (!isSeeded) {
    await seedKnowledge();
    isSeeded = true;
  }
};

export interface AskDto {
  question: string;
  userId: string;
}

export const askNavigator = async (dto: AskDto): Promise<string> => {
  await ensureKnowledgeSeeded();

  const user = await prisma.user.findUnique({
    where: { id: dto.userId },
    select: { firstName: true, schoolGrade: true, city: true },
  });

  if (!user) throw new Error('Пользователь не найден');

  const similarChunks = await searchSimilar(dto.question, 4);
  const context = similarChunks.join('\n\n---\n\n');

  const answer = await generateAnswer(dto.question, context, {
    firstName: user.firstName,
    schoolGrade: user.schoolGrade,
    city: user.city ?? undefined,
  });

  await prisma.chatMessage.createMany({
    data: [
      { userId: dto.userId, role: 'user', content: dto.question },
      { userId: dto.userId, role: 'assistant', content: answer },
    ],
  });

  return answer;
};

export const getChatHistory = async (userId: string) => {
  return prisma.chatMessage.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });
};
