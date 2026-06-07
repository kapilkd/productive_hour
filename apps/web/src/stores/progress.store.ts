import { create } from 'zustand';
import { apiClient } from '../services/api.service';
import type { ChapterWithProgress } from '../types';

interface ProgressState {
  chapterProgress: Record<string, ChapterWithProgress[]>;  // keyed by subjectId
  iqScores: Record<string, number>;                         // keyed by subjectId
  fetchProgress: (subjectId: string) => Promise<void>;
  updateFrameProgress: (subjectId: string, chapterId: string, lastFrameIndex: number) => void;
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  chapterProgress: {},
  iqScores: {},

  fetchProgress: async (subjectId: string) => {
    const [chaptersRes, iqRes] = await Promise.all([
      apiClient.get(`/student/subjects/${subjectId}/chapters`),
      apiClient.get(`/student/iq/${subjectId}`),
    ]);
    set(state => ({
      chapterProgress: { ...state.chapterProgress, [subjectId]: chaptersRes.data },
      iqScores: { ...state.iqScores, [subjectId]: iqRes.data.score },
    }));
  },

  updateFrameProgress: (subjectId: string, chapterId: string, lastFrameIndex: number) => {
    const current = get().chapterProgress[subjectId] ?? [];
    const updated = current.map(c =>
      c.id === chapterId
        ? { ...c, progress: { ...c.progress, status: 'in_progress' as const, lastFrameIndex } }
        : c
    );
    set(state => ({ chapterProgress: { ...state.chapterProgress, [subjectId]: updated } }));
  },
}));
