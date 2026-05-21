import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const getEmbedding = async (text: string): Promise<number[]> => {
  const response = await fetch(
    'https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: text, options: { wait_for_model: true } }),
    }
  );
  if (!response.ok) throw new Error(`HuggingFace error: ${await response.text()}`);
  return await response.json() as number[];
};

export const getSchoolContext = (): string => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const year = now.getFullYear();
  let period = '';
  if (month === 9) period = 'начало учебного года';
  else if (month >= 10 && month <= 11) period = 'первая четверть';
  else if (month === 12 || month === 1) period = 'конец первой / начало второй четверти';
  else if (month >= 2 && month <= 3) period = 'вторая четверть';
  else if (month === 4) period = 'третья четверть';
  else if (month === 5) period = 'конец учебного года';
  else if (month === 6) period = 'период сдачи ЦЭ/ЦТ';
  else if (month >= 7 && month <= 8) period = 'период подачи документов';
  return `Дата: ${day}.${month}.${year}, период: ${period}`;
};

export const generateAnswer = async (
  question: string,
  context: string,
  userProfile: string,
  userInfo: { firstName: string; schoolGrade: number; city?: string }
): Promise<string> => {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `Ты — AI-навигатор Будучыня.BY для школьников Беларуси. ${getSchoolContext()}
Знаешь ЦЭ, ЦТ, РТ, вузы РБ, проходные баллы.
Обращайся по имени (${userInfo.firstName}), используй реальные данные профиля.
Отвечай конкретно на русском языке.

ПРОФИЛЬ:
${userProfile}

БАЗА ЗНАНИЙ:
${context}`,
      },
      { role: 'user', content: question },
    ],
    temperature: 0.7,
    max_tokens: 1024,
  });
  return completion.choices[0].message.content || 'Не удалось получить ответ';
};

export const computeCRIWithAI = async (userProfile: string): Promise<number> => {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{
      role: 'user',
      content: `Рассчитай CRI (Career Readiness Index) школьника по формуле.
Ответь ТОЛЬКО целым числом 0-100. Никакого текста.

ФОРМУЛА (считай точно):
A = (средний_балл / 10) * 35
B = если есть ЦЭ/ЦТ/РТ: (средний_балл_экзаменов / 100) * 25, иначе 0
C = если есть реальные достижения (олимпиады/НПК/конкурсы): 20, иначе 0
D = (количество_предметов_с_оценками / 16) * 10
E = если есть И характеристика И увлечения: 10, если одно: 5, иначе 0
CRI = round(A + B + C + D + E)

ДАННЫЕ:
${userProfile}

Результат (число):`,
    }],
    temperature: 0.0,
    max_tokens: 5,
  });

  const raw = completion.choices[0].message.content?.trim() || '0';
  console.log(`[CRI initial] AI: "${raw}"`);
  const match = raw.match(/\d+/);
  const num = match ? parseInt(match[0]) : 0;
  return Math.min(100, Math.max(0, num));
};

export const recalcCRIStrict = async (
  userProfile: string,
  currentCRI: number,
  currentData: string
): Promise<{ newCRI: number; changed: boolean; reason: string }> => {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{
      role: 'user',
      content: `Ты — точная система пересчёта CRI школьника Беларуси.

ТЕКУЩИЙ CRI: ${currentCRI}%

ФОРМУЛА CRI (считай точно):
A = (средний_балл_по_всем_оценкам / 10) * 35
B = если есть ЦЭ/ЦТ/РТ: (средний_балл_экзаменов / 100) * 25, иначе 0  
C = если есть реальные достижения (олимпиады/НПК/конкурсы): 20, иначе 0
D = (количество_предметов_с_оценками / 16) * 10
E = если есть И характеристика И увлечения: 10, если одно: 5, иначе 0
CRI = round(A + B + C + D + E)

ТЕКУЩИЕ ДАННЫЕ УЧЕНИКА:
${currentData}

ПОЛНЫЙ ПРОФИЛЬ:
${userProfile}

ИНСТРУКЦИИ:
1. Посчитай новый CRI по формуле используя текущие данные
2. Сравни с текущим CRI (${currentCRI}%)
3. Если разница >= 2% — CRI изменился (changed: true)
4. Если разница < 2% — CRI не изменился (changed: false, newCRI = ${currentCRI})
5. CRI может как расти так и падать — это нормально
6. Максимальное изменение за раз: ±20 пунктов

Ответь ТОЛЬКО JSON без markdown:
{"newCRI": число, "changed": true/false, "reason": "объяснение на русском что изменилось и почему"}`,
    }],
    temperature: 0.0,
    max_tokens: 200,
  });

  const raw = completion.choices[0].message.content?.trim() || '{}';
  console.log(`[CRI recalc] currentCRI=${currentCRI}, AI: "${raw}"`);

  try {
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    const newCRI = Math.min(100, Math.max(0, Math.round(Number(parsed.newCRI)) || currentCRI));
    const changed = Math.abs(newCRI - currentCRI) >= 2 && Boolean(parsed.changed);
    return {
      newCRI: changed ? newCRI : currentCRI,
      changed,
      reason: String(parsed.reason || 'Нет изменений'),
    };
  } catch {
    console.error('[CRI recalc] JSON parse error:', raw);
    return { newCRI: currentCRI, changed: false, reason: 'Ошибка анализа' };
  }
};
