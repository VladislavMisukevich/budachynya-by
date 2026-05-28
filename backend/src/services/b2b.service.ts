import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getContracts = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { grades: true, careerProfile: true },
  });

  const contracts = await prisma.contract.findMany({
    where: { isActive: true },
    include: {
      company: true,
      applications: { where: { userId } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const userCRI = user?.careerProfile?.cri ?? 0;
  const allScores = user?.grades.flatMap(g =>
    [g.quarter1, g.quarter2, g.quarter3, g.quarter4, g.yearScore, g.finalScore]
      .filter((v): v is number => v !== null && v !== undefined)
  ) ?? [];
  const userAvgGrade = allScores.length
    ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;

  return contracts.map(contract => ({
    ...contract,
    isApplied: contract.applications.length > 0,
    applicationStatus: contract.applications[0]?.status ?? null,
    isEligible: userCRI >= contract.minCRI && userAvgGrade >= contract.minGrade,
    userCRI,
    userAvgGrade: Math.round(userAvgGrade * 10) / 10,
  }));
};

export const applyContract = async (userId: string, contractId: string, message?: string) => {
  const contract = await prisma.contract.findUnique({ where: { id: contractId } });
  if (!contract) throw new Error('Контракт не найден');
  if (!contract.isActive) throw new Error('Контракт уже закрыт');
  if (contract.slotsTaken >= contract.slotsTotal) throw new Error('Все места заняты');

  const existing = await prisma.contractApplication.findUnique({
    where: { userId_contractId: { userId, contractId } },
  });
  if (existing) throw new Error('Вы уже подали заявку на этот контракт');

  const [application] = await prisma.$transaction([
    prisma.contractApplication.create({
      data: { userId, contractId, message },
    }),
    prisma.contract.update({
      where: { id: contractId },
      data: { slotsTaken: { increment: 1 } },
    }),
  ]);

  return application;
};

export const getMyApplications = async (userId: string) => {
  return prisma.contractApplication.findMany({
    where: { userId },
    include: {
      contract: { include: { company: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};
