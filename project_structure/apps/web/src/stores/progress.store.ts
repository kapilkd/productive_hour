import { create } from 'zustand';
import { StudentChapterProgress } from '../types';
import { apiClient } from '../services/api.service';

interface ProgressState {
  chapterProgress: Record<string, StudentChapterProgress>;
  iqScores: Record<string, number>; // keyed by subjectId
  fetchProgress: (subjectId: string) => Promise<void>;
  updateChapterProgress: (chapterId: string, patch: Partial<StudentChapterProgress>) => void;
  setIqScore: (subjectId: string, score: number) => void;
}

export const useProgressStore = create<ProgressState>((set) => ({
  chapterProgress: {},
  iqScores: {},

  fetchProgress: async (subjectId) => {
    const [chaptersRes, iqRes] = await Promise.all([
      apiClient.get(`/student/subjects/${subjectId}/chapters`),
      apiClient.get(`/student/iq/${subjectId}`),
    ]);

    const progressMap: Record<string, StudentChapterProgress> = {};
    for (const c of chaptersRes.data) {
      progressMap[c.id] = c.progress;
    }

    set((s) => ({
      chapterProgress: { ...s.chapterProgress, ...progressMap },
      iqScores: { ...s.iqScores, [subjectId]: iqRes.data.score },
    }));
  },

  updateChapterProgress: (chapterId, patch) => {
    set((s) => ({
      chapterProgress: {
        ...s.chapterProgress,
        [chapterId]: { ...s.chapterProgress[chapterId], ...patch } as StudentChapterProgress,
      },
    }));
  },

  setIqScore: (subjectId, score) => {
    set((s) => ({ iqScores: { ...s.iqScores, [subjectId]: score } }));
  },
}));
