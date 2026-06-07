import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../../services/api.service';
import type { Frame } from '../../types';

interface ChapterDetail {
  id: string;
  title: string;
  frames: Frame[];
  myProgress: { status: string; lastFrameIndex: number } | null;
}

export default function ListenPage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { subjectId, subjectName } = (location.state as any) ?? {};

  const [chapter, setChapter] = useState<ChapterDetail | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    apiClient.get(`/student/chapters/${chapterId}`)
      .then(r => {
        const data: ChapterDetail = r.data;
        setChapter(data);
        // Resume from where the student left off
        const resumeIndex = data.myProgress?.lastFrameIndex ?? 0;
        setCurrentIndex(Math.min(resumeIndex, Math.max(0, data.frames.length - 1)));
      })
      .finally(() => setLoading(false));
  }, [chapterId]);

  const markCurrentListened = useCallback(async (frameId: string) => {
    if (marking) return;
    setMarking(true);
    try {
      await apiClient.post('/student/progress/frame', { frameId });
    } finally {
      setMarking(false);
    }
  }, [marking]);

  const goNext = async () => {
    if (!chapter) return;
    const frame = chapter.frames[currentIndex];
    if (frame) await markCurrentListened(frame.id);
    if (currentIndex < chapter.frames.length - 1) {
      setCurrentIndex(i => i + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex(i => i - 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading chapter…</p>
      </div>
    );
  }

  if (!chapter || chapter.frames.length === 0) {
    return (
      <div className="p-8">
        <p className="text-gray-500">No frames in this chapter yet.</p>
        <button onClick={() => navigate(-1)} className="text-indigo-400 hover:text-indigo-300 text-sm mt-4">← Back</button>
      </div>
    );
  }

  const frame = chapter.frames[currentIndex];
  const total = chapter.frames.length;
  const isLast = currentIndex === total - 1;
  const progressPct = ((currentIndex + 1) / total) * 100;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="border-b border-gray-800 px-6 py-3 flex items-center gap-4">
        <button
          onClick={() => navigate(`/student/subjects/${subjectId}`, { state: { subjectName } })}
          className="text-gray-400 hover:text-white text-sm"
        >
          ←
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-gray-400 text-xs truncate">{subjectName}</p>
          <p className="text-white text-sm font-medium truncate">{chapter.title}</p>
        </div>
        <p className="text-gray-500 text-sm shrink-0">Frame {currentIndex + 1} / {total}</p>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-800">
        <div
          className="h-full bg-indigo-500 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Frame content */}
      <div className="flex-1 flex items-start justify-center px-6 pt-12 pb-6">
        <div className="w-full max-w-2xl">
          <p className="text-white text-xl leading-relaxed">{frame.contentText}</p>
          {frame.imageUrl && (
            <img src={frame.imageUrl} alt="" className="mt-6 rounded-xl w-full object-cover max-h-64" />
          )}
        </div>
      </div>

      {/* Frame dots */}
      <div className="flex justify-center gap-1.5 pb-4">
        {chapter.frames.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === currentIndex ? 'bg-indigo-400' : i < currentIndex ? 'bg-indigo-700' : 'bg-gray-700'
            }`}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="border-t border-gray-800 px-6 py-4 flex justify-between items-center">
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ← Previous
        </button>

        {isLast ? (
          <button
            onClick={async () => {
              await markCurrentListened(frame.id);
              navigate(`/student/subjects/${subjectId}`, { state: { subjectName } });
            }}
            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-green-600 hover:bg-green-500 text-white transition-colors"
          >
            Complete Chapter
          </button>
        ) : (
          <button
            onClick={goNext}
            disabled={marking}
            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-colors"
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
}
