import { PrismaClient } from '@prisma/client';
import Groq from 'groq-sdk';
import { buildUserProfile } from './ai.service';
import { getSchoolContext } from './gemini.service';

const prisma = new PrismaClient();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface TrackerStep {
  month: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  done: boolean;
}

export interface TrackerPlan {
  targetUniversity: string;
  targetFaculty: string;
  targetSpecialty: string;
  requiredScore: number;
  currentScore: number;
  gap: number;
  feasibility: 'high' | 'medium' | 'low';
  feasibilityText: string;
  weakSubjects: string[];
  strongSubjects: string[];
  steps: TrackerStep[];
  generatedAt: string;
}

export const generateTrackerPlan = async (
  userId: string,
  desiredSphere?: string,
  desiredUniversity?: string
): Promise<TrackerPlan> => {
  const { profileText, user, avgScore } = await buildUserProfile(userId);
  const schoolContext = getSchoolContext();

  const prompt = `Ты — карьерный навигатор для школьника Беларуси. Составь персональную дорожную карту поступления.

${schoolContext}

ПРОФИЛЬ УЧЕНИКА:
${profileText}

ЖЕЛАЕМАЯ СФЕРА: ${desiredSphere || 'не указана — определи сам на основе сильных предметов'}
ЖЕЛАЕМЫЙ ВУЗ: ${desiredUniversity || 'не указан — предложи лучший вариант'}

ЗАДАЧА: Составь конкретный план поступления с реальными шагами по месяцам.

Ответь СТРОГО в JSON формате (только JSON, никакого текста):
{
  "targetUniversity": "название вуза РБ",
  "targetFaculty": "факультет",
  "targetSpecialty": "специальность",
  "requiredScore": число (проходной балл из 400),
  "currentScore": число (оценка текущих шансов из 400),
  "gap": число (разница),
  "feasibility": "high/medium/low",
  "feasibilityText": "текст объяснения реалистичности",
  "weakSubjects": ["предмет1", "предмет2"],
  "strongSubjects": ["предмет1", "предмет2"],
  "steps": [
    {
      "month": "Май 2026",
      "title": "краткое название шага",
      "description": "детальное описание что делать",
      "priority": "high/medium/low",
      "done": false
    }
  ]
}

Требования к steps:
- Минимум 8 шагов, максимум 12
- Шаги должны быть конкретными (не "учись лучше" а "запишись на курсы по математике в БГУИР")
- Учитывай текущий период учебного года
- Включи шаги про РТ (март), ЦЭ (май-июнь), подачу документов (июль)
- Учитывай слабые предметы и давай конкретные советы
- Если есть достижения — используй их как преимущество`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 2000,
  });

  const raw = completion.choices[0].message.content?.trim() || '{}';
  console.log('[Tracker] Raw response length:', raw.length);

  try {
    const clean = raw.replace(/```json|```/g, '').trim();
    const plan: TrackerPlan = { ...JSON.parse(clean), generatedAt: new Date().toISOString() };

    await prisma.careerProfile.upsert({
      where: { userId },
      create: {
        userId,
        desiredSphere: desiredSphere || plan.targetFaculty,
        desiredUniversity: desiredUniversity || plan.targetUniversity,
        trackerPlan: plan as object,
        updatedAt: new Date(),
      },
      update: {
        desiredSphere: desiredSphere || plan.targetFaculty,
        desiredUniversity: desiredUniversity || plan.targetUniversity,
        trackerPlan: plan as object,
        updatedAt: new Date(),
      },
    });

    return plan;
  } catch (e) {
    console.error('[Tracker] Parse error:', e, '\nRaw:', raw);
    throw new Error('Ошибка генерации плана');
  }
};

export const getTrackerPlan = async (userId: string): Promise<TrackerPlan | null> => {
  const profile = await prisma.careerProfile.findUnique({ where: { userId } });
  if (!profile?.trackerPlan) return null;
  return profile.trackerPlan as unknown as TrackerPlan;
};

export const toggleStep = async (
  userId: string,
  stepIndex: number
): Promise<TrackerPlan> => {
  const profile = await prisma.careerProfile.findUnique({ where: { userId } });
  if (!profile?.trackerPlan) throw new Error('План не найден');

  const plan = profile.trackerPlan as unknown as TrackerPlan;
  if (stepIndex < 0 || stepIndex >= plan.steps.length) throw new Error('Шаг не найден');

  plan.steps[stepIndex].done = !plan.steps[stepIndex].done;

  await prisma.careerProfile.update({
    where: { userId },
    data: { trackerPlan: plan as object },
  });

  return plan;
};
