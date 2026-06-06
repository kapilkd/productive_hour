import { useEffect } from 'react';
import { usePlayerStore } from '../stores/player.store';
import { apiClient } from '../services/api.service';

// Marks a frame as listened in the DB. Called when Howl fires onend.
export function useMarkFrameListened() {
  return async (frameId: string) => {
    await apiClient.post('/student/progress/frame', { frameId });
  };
}

// Loads a chapter into the player store on mount; cleans up on unmount.
export function useChapterLoader(chapterId: string) {
  const { loadChapter, play, reset } = usePlayerStore();

  useEffect(() => {
    let cancelled = false;

    apiClient.get(`/student/chapters/${chapterId}`).then(({ data }) => {
      if (cancelled) return;
      const startIndex = data.myProgress?.lastFrameIndex ?? 0;
      loadChapter(data, data.frames, startIndex);
      // Auto-play fires after a short yield so the component has rendered
      setTimeout(() => !cancelled && play(), 500);
    });

    return () => {
      cancelled = true;
      reset();
    };
  }, [chapterId]);
}
