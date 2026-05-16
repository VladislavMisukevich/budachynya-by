import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const getEmbedding = async (text: string): Promise<number[]> => {
  const HF_API_KEY = process.env.HF_API_KEY;
  const response = await fetch(
    'https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: text, options: { wait_for_model: true } }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`HuggingFace embedding error: ${err}`);
  }

  const data = await response.json() as number[];
  return data;
};

export const generateAnswer = async (
  question: string,
  context: string,
  userInfo: { firstName: string; schoolGrade: number; city?: string }
): Promise<string> => {
  const systemPrompt = `Ты — AI-навигатор платформы Будучыня.BY для школьников Беларуси.
Твоя задача — помогать ученикам выбрать профессию и путь поступления в вузы РБ.
Ты знаешь специфику белорусского образования: ЦЭ (централизованный экзамен), ЦТ, проходные баллы, вузы РБ.
Отвечай на русском языке. Будь дружелюбным, конкретным и полезным.
Ученик: ${userInfo.firstName}, ${userInfo.schoolGrade} класс${userInfo.city ? `, ${userInfo.city}` : ''}.

Используй следующий контекст для ответа:
${context}

Если контекст не содержит нужной информации — отвечай на основе своих знаний о системе образования РБ.`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question },
    ],
    temperature: 0.7,
    max_tokens: 1024,
  });

  return completion.choices[0].message.content || 'Не удалось получить ответ';
};
