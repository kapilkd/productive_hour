import { usePlayerStore } from '../stores/player.store';
import { apiClient } from '../services/api.service';

// Wraps answer submission: calls the API, then calls store.submitAnswer + dismissQuestion
export function useAnswerQuestion() {
  const { currentQuestion, submitAnswer, dismissQuestion } = usePlayerStore();

  return async (selectedOption: string) => {
    if (!currentQuestion) return;

    const { data } = await apiClient.post(`/student/questions/${currentQuestion.id}/respond`, {
      selectedOption,
    });

    submitAnswer(selectedOption);
    return data as { isCorrect: boolean; iqDelta: number; newScore: number };
  };
}
