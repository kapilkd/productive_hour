import { Difficulty } from '../../../../shared/types';

const DELTAS: Record<Difficulty, { correct: number; incorrect: number }> = {
  easy:   { correct: +2, incorrect: -1 },
  medium: { correct: +4, incorrect: -3 },
  hard:   { correct: +6, incorrect: -5 },
};

export function updateIqScore(current: number, isCorrect: boolean, difficulty: Difficulty): number {
  const delta = DELTAS[difficulty];
  const change = isCorrect ? delta.correct : delta.incorrect;
  return Math.max(0, Math.min(100, current + change));
}

export function getIqDelta(isCorrect: boolean, difficulty: Difficulty): number {
  const delta = DELTAS[difficulty];
  return isCorrect ? delta.correct : delta.incorrect;
}
