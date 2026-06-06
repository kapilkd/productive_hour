import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/api.service';
import { Frame } from '../../types';
import FrameEditor from '../../components/admin/FrameEditor';

export default function ChapterDetailPage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();
  const [frames, setFrames] = useState<Frame[]>([]);
  const [editingFrame, setEditingFrame] = useState<Frame | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [chapterTitle, setChapterTitle] = useState('');

  useEffect(() => {
    apiClient.get(`/admin/chapters/${chapterId}/frames`).then(({ data }) => {
      setFrames(data.sort((a: Frame, b: Frame) => a.orderIndex - b.orderIndex));
    });
    // TODO: GET /admin/chapters/:id to get the title directly
  }, [chapterId]);

  const onFrameSaved = (saved: Frame) => {
    setFrames((prev) => {
      const idx = prev.findIndex((f) => f.id === saved.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = saved;
        return updated;
      }
      return [...prev, saved].sort((a, b) => a.orderIndex - b.orderIndex);
    });
    setShowNewForm(false);
    setEditingFrame(null);
  };

  const onDelete = async (frameId: string) => {
    if (!confirm('Delete this frame? The audio file will also be removed.')) return;
    await apiClient.delete(`/admin/frames/${frameId}`);
    setFrames((prev) => prev.filter((f) => f.id !== frameId));
  };

  const statusBadge = (status: Frame['audioStatus']) => {
    const map: Record<string, string> = {
      pending: 'bg-gray-700 text-gray-400',
      generating: 'bg-yellow-800 text-yellow-300',
      ready: 'bg-green-800 text-green-300',
      failed: 'bg-red-800 text-red-300',
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] ?? map.pending}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-8 max-w-3xl">
      <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white text-sm mb-4">
        ← Back
      </button>
      <h1 className="text-2xl font-bold mb-2">Frames</h1>
      <p className="text-gray-400 text-sm mb-6">
        Each frame is narrated in sequence. Adding or editing a frame automatically queues a TTS job.
      </p>

      {/* Existing frames */}
      <div className="space-y-4 mb-8">
        {frames.length === 0 && <p className="text-gray-400 text-sm">No frames yet.</p>}
        {frames.map((f, i) => (
          <div key={f.id} className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <span className="text-gray-500 font-mono text-sm shrink-0">#{i + 1}</span>
              <div className="flex items-center gap-2">
                {statusBadge(f.audioStatus)}
                <button onClick={() => setEditingFrame(f)} className="text-xs text-indigo-400 hover:text-indigo-300">
                  Edit
                </button>
                <button onClick={() => onDelete(f.id)} className="text-xs text-gray-500 hover:text-red-400">
                  Delete
                </button>
              </div>
            </div>

            {editingFrame?.id === f.id ? (
              <FrameEditor
                chapterId={chapterId!}
                frame={f}
                onSave={(saved) => { onFrameSaved(saved); setEditingFrame(null); }}
              />
            ) : (
              <p className="text-gray-200 text-sm leading-relaxed line-clamp-3">{f.contentText}</p>
            )}
          </div>
        ))}
      </div>

      {/* Add new frame */}
      {showNewForm ? (
        <div className="bg-gray-800 border border-indigo-600 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-indigo-300 mb-4">New Frame #{frames.length + 1}</h3>
          <FrameEditor
            chapterId={chapterId!}
            onSave={(saved) => { onFrameSaved(saved); setShowNewForm(false); }}
          />
          <button onClick={() => setShowNewForm(false)} className="mt-3 text-xs text-gray-400 hover:text-white">
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowNewForm(true)}
          className="w-full border-2 border-dashed border-gray-700 hover:border-indigo-500 rounded-xl py-4 text-sm text-gray-500 hover:text-indigo-400 transition-colors"
        >
          + Add Frame
        </button>
      )}
    </div>
  );
}
