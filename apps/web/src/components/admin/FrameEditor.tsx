import React, { useState } from 'react';
import { apiClient } from '../../services/api.service';
import type { Frame, AudioStatus } from '../../types';

// ── TTS Status Badge ──────────────────────────────────────────────────────────

const statusStyles: Record<AudioStatus, string> = {
  pending:    'bg-yellow-500/20 text-yellow-400',
  generating: 'bg-blue-500/20 text-blue-400',
  ready:      'bg-green-500/20 text-green-400',
  failed:     'bg-red-500/20 text-red-400',
};

export function TTSBadge({ status }: { status: AudioStatus }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyles[status]}`}>
      {status}
    </span>
  );
}

// ── Add Frame Form ────────────────────────────────────────────────────────────

interface AddFrameProps {
  chapterId: string;
  nextIndex: number;
  onAdded: (frame: Frame) => void;
  onCancel: () => void;
}

export function AddFrameForm({ chapterId, nextIndex, onAdded, onCancel }: AddFrameProps) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    setError('');
    try {
      const { data } = await apiClient.post('/admin/frames', {
        chapterId,
        contentText: text.trim(),
        orderIndex: nextIndex,
      });
      onAdded(data);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to create frame');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl p-4 space-y-3 border border-gray-700">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Frame content — this text will be narrated to the student"
        rows={3}
        className="w-full bg-gray-900 text-white rounded-lg px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500 resize-none"
        required
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          {saving ? 'Adding…' : 'Add Frame'}
        </button>
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-white px-4 py-2 text-sm">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Inline Frame Row ──────────────────────────────────────────────────────────

interface FrameRowProps {
  frame: Frame;
  index: number;
  onUpdated: (frame: Frame) => void;
  onDeleted: (id: string) => void;
}

export function FrameRow({ frame, index, onUpdated, onDeleted }: FrameRowProps) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(frame.contentText);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    if (!text.trim() || text === frame.contentText) { setEditing(false); return; }
    setSaving(true);
    try {
      const { data } = await apiClient.put(`/admin/frames/${frame.id}`, { contentText: text.trim() });
      onUpdated(data);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this frame?')) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/admin/frames/${frame.id}`);
      onDeleted(frame.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="text-gray-500 text-sm shrink-0 mt-0.5">#{index + 1}</span>
          <div className="flex-1 min-w-0">
            {editing ? (
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={3}
                autoFocus
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            ) : (
              <p className="text-gray-200 text-sm leading-relaxed">{frame.contentText}</p>
            )}
            <div className="mt-2">
              <TTSBadge status={frame.audioStatus} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-green-400 hover:text-green-300 text-sm px-2 py-1 rounded hover:bg-gray-800 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => { setText(frame.contentText); setEditing(false); }}
                className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded hover:bg-gray-800"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="text-indigo-400 hover:text-indigo-300 text-sm px-2 py-1 rounded hover:bg-gray-800"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded hover:bg-gray-800 disabled:opacity-50"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
