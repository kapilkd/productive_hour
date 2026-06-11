import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../../services/api.service';
import type { ChapterWithProgress, ChapterStatus } from '../../types';

const statusConfig: Record<ChapterStatus, { label: string; className: string }> = {
  not_started: { label: 'Not started', className: 'neu-badge' },
  in_progress:  { label: 'In progress',  className: 'neu-badge-info' },
  completed:    { label: 'Completed',    className: 'neu-badge-success' },
};

export default function SubjectChaptersPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const subjectName = (location.state as any)?.subjectName ?? 'Subject';

  const [chapters, setChapters] = useState<ChapterWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get(`/student/subjects/${subjectId}/chapters`)
      .then(r => setChapters(r.data))
      .finally(() => setLoading(false));
  }, [subjectId]);

  return (
    <div className="p-8 neu-page min-h-screen" style={{ maxWidth: '720px' }}>
      <button onClick={() => navigate('/student/subjects')}
        className="neu-btn neu-btn-raised neu-btn-sm mb-6">
        ← My Subjects
      </button>

      <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--neu-text)' }}>{subjectName}</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--neu-text-muted)' }}>Chapters</p>

      {loading ? (
        <div className="flex items-center gap-3" style={{ color: 'var(--neu-text-muted)' }}>
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Loading…
        </div>
      ) : chapters.length === 0 ? (
        <p style={{ color: 'var(--neu-text-muted)' }}>No chapters available yet.</p>
      ) : (
        <div className="space-y-3">
          {chapters.map((chapter, idx) => {
            const status = chapter.progress?.status ?? 'not_started';
            const cfg = statusConfig[status];
            const isLocked = idx > 0 && chapters[idx - 1].progress?.status !== 'completed'
              && status === 'not_started';
            return (
              <button
                key={chapter.id}
                onClick={() => !isLocked && navigate(`/student/chapters/${chapter.id}/listen`, {
                  state: { chapterTitle: chapter.title, subjectId, subjectName }
                })}
                disabled={isLocked}
                className="neu-card w-full text-left"
                style={{ cursor: isLocked ? 'not-allowed' : 'pointer', opacity: isLocked ? 0.5 : 1 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="neu-raised flex items-center justify-center w-9 h-9 rounded-xl shrink-0 text-sm font-bold"
                         style={{ color: status === 'completed' ? 'var(--neu-success)' : 'var(--neu-text-muted)' }}>
                      {status === 'completed' ? '✓' : idx + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--neu-text)' }}>
                        {chapter.title}
                      </p>
                      {chapter.description && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--neu-text-muted)' }}>
                          {chapter.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <span className={`neu-badge ${cfg.className}`}>{cfg.label}</span>
                    {!isLocked && (
                      <span style={{ color: 'var(--neu-accent)', fontSize: '18px' }}>▶</span>
                    )}
                    {isLocked && <span style={{ color: 'var(--neu-text-muted)' }}>🔒</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
