import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../../services/api.service';
import type { Frame } from '../../types';
import { AddFrameForm, FrameRow } from '../../components/admin/FrameEditor';

export default function ChapterDetailPage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const chapterTitle = (location.state as any)?.chapterTitle ?? 'Chapter';

  const [frames, setFrames] = useState<Frame[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    apiClient.get(`/admin/chapters/${chapterId}/frames`)
      .then(r => setFrames(r.data))
      .finally(() => setLoading(false));
  }, [chapterId]);

  return (
    <div className="p-8">
      <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white text-sm mb-4 flex items-center gap-1">
        ← Back
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">{chapterTitle}</h1>
          <p className="text-gray-400 text-sm">{frames.length} frame{frames.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowAddForm(f => !f)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {showAddForm ? 'Cancel' : '+ Add Frame'}
        </button>
      </div>

      {showAddForm && (
        <div className="mb-4">
          <AddFrameForm
            chapterId={chapterId!}
            nextIndex={frames.length}
            onAdded={frame => {
              setFrames(prev => [...prev, frame]);
              setShowAddForm(false);
            }}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : frames.length === 0 ? (
        <p className="text-gray-500">No frames yet. Add the first frame to get started.</p>
      ) : (
        <div className="space-y-2">
          {frames.map((frame, idx) => (
            <FrameRow
              key={frame.id}
              frame={frame}
              index={idx}
              onUpdated={updated => setFrames(prev => prev.map(f => f.id === updated.id ? updated : f))}
              onDeleted={id => setFrames(prev => prev.filter(f => f.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
