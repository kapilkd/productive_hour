// Re-export all shared domain types for use inside the web app.
// Add web-only UI types below the re-export.

export * from '../../../../shared/types';

// ── Web-only ──────────────────────────────────────────────────────────────────

export type PlayerState = 'idle' | 'loading' | 'playing' | 'paused' | 'question' | 'answered' | 'complete' | 'error';

export interface ChapterWithProgress {
  id: string;
  subjectId: string;
  title: string;
  description?: string;
  orderIndex: number;
  progress: {
    status: 'not_started' | 'in_progress' | 'completed';
    lastFrameIndex: number;
  };
}
