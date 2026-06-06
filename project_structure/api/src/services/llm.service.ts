import Anthropic from '@anthropic-ai/sdk';
import { Difficulty, LlmQuestionPayload } from '../../../../shared/types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface QuestionParams {
  iqScore: number;
  chapterTitle: string;
  recentFrames: Array<{ contentText: string }>;
}

const SYSTEM_PROMPT = `
You are an adaptive educational assistant. Your job is to generate one multiple-choice
question to assess a student's understanding of the content they just listened to.

Rules:
- Generate EXACTLY one question with 4 options labeled A, B, C, D.
- One option must be clearly correct. The others must be plausible but wrong.
- Match difficulty to the student's IQ score (0-100):
    0-30  → very simple recall questions
    31-60 → moderate comprehension questions
    61-80 → application-level questions
    81-100 → analysis or inference questions
- Keep the question under 30 words.
- Each option under 20 words.
- End with a one-sentence encouraging message for the student regardless of difficulty.
- Respond in strict JSON only. No markdown, no extra text.

JSON format:
{
  "question": "...",
  "options": [
    { "label": "A", "text": "..." },
    { "label": "B", "text": "..." },
    { "label": "C", "text": "..." },
    { "label": "D", "text": "..." }
  ],
  "correct": "A",
  "difficulty": "medium",
  "boost_message": "You're doing great — keep going!"
}
`.trim();

function buildUserPrompt(params: QuestionParams): string {
  const frameLines = params.recentFrames
    .map((f, i) => `Frame ${i + 1}: ${f.contentText}`)
    .join('\n\n');
  return `
Student IQ score for this subject: ${params.iqScore}/100
Chapter title: ${params.chapterTitle}
Recent frames the student just listened to:
${frameLines}

Generate one adaptive question now.
`.trim();
}

async function callLlm(userPrompt: string): Promise<LlmQuestionPayload> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const raw = message.content[0].type === 'text' ? message.content[0].text : '';
  return JSON.parse(raw) as LlmQuestionPayload;
}

export async function generateQuestion(params: QuestionParams): Promise<LlmQuestionPayload | null> {
  const userPrompt = buildUserPrompt(params);
  try {
    return await callLlm(userPrompt);
  } catch {
    // Retry once on parse failure
    try {
      return await callLlm(userPrompt);
    } catch (err) {
      console.error('[llm.service] Failed to generate question after retry:', err);
      return null; // Caller skips question on null — never block audio playback
    }
  }
}

export function getDifficultyFromIq(score: number): Difficulty {
  if (score <= 30) return 'easy';
  if (score <= 60) return 'medium';
  return 'hard';
}
