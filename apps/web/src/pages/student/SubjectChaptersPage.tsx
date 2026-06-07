import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../../services/api.service';
import type { ChapterWithProgress, ChapterStatus } from '../../types';

const statusBadge: Record<ChapterStatus, string> = {
  not_started: 'bg-gray-700 text-gray-400',
  in_progress:  'bg-blue-500/20 text-blue-400',
  completed:    'bg-green-500/20 text-green-400',
};

const statusLabel: Record<ChapterStatus, string> = {
  not_started: 'Not started',
  in_progress:  'In progress',
  completed:    'Completed',
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
    <div className="p-8 max-w-2xl">
      <button onClick={() => navigate('/student/subjects')} className="text-gray-400 hover:text-white text-sm mb-4 flex items-center gap-1">
        ← My Subjects
      </button>

      <h1 className="text-2xl font-bold text-white mb-1">{subjectName}</h1>
      <p className="text-gray-400 text-sm mb-8">Chapters</p>

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : chapters.length === 0 ? (
        <p className="text-gray-500">No chapters available yet.</p>
      ) : (
        <div className="space-y-2">
          {chapters.map((chapter, idx) => {
            const status = chapter.progress?.status ?? 'not_started';
            return (
              <button
                key={chapter.id}
                onClick={() => navigate(`/student/chapters/${chapter.id}/listen`, {
                  state: { chapterTitle: chapter.title, subjectId, subjectName }
                })}
                className="w-full bg-gray-900 hover:bg-gray-800 rounded-xl px-5 py-4 text-left transition-colors group flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <span className="text-gray-500 text-sm w-6 shrink-0">{idx + 1}</span>
                  <div>
                    <p className="text-white font-medium group-hover:text-indigo-300 transition-colors">{chapter.title}</p>
                    {chapter.description && (
                      <p className="text-gray-400 text-sm mt-0.5">{chapter.description}</p>
                    )}
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ml-4 ${statusBadge[status]}`}>
                  {statusLabel[status]}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
