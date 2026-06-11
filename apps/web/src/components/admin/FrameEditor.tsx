import React, { useState } from 'react';
import { apiClient } from '../../services/api.service';
import type { Frame, AudioStatus } from '../../types';

// ── TTS Status Badge ──────────────────────────────────────────────────────────

const statusClass: Record<AudioStatus, string> = {
  pending:    'neu-badge-warn',
  generating: 'neu-badge-info',
  ready:      'neu-badge-success',
  failed:     '',
};

export function TTSBadge({ status }: { status: AudioStatus }) {
  return (
    <span className={`neu-badge ${statusClass[status]}`}
          style={status === 'failed' ? { background: '#7f1d1d', color: '#f87171' } : undefined}>
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
    setSaving(true); setError('');
    try {
      const { data } = await apiClient.post('/admin/frames', {
        chapterId, contentText: text.trim(), orderIndex: nextIndex,
      });
      onAdded(data);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to create frame');
    } finally { setSaving(false); }
  };

  return (
    <div className="neu-card">
      <p className="mb-3" style={{ color: 'var(--neu-text-muted)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Manual Frame
      </p>
      <form onSubmit={handleSubmit}>
        <div className="neu-input-group">
          <label className="neu-label">Narration text</label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="This text will be narrated to the student…"
            rows={3}
            className="neu-textarea"
            required
          />
        </div>
        {error && <p className="text-sm mb-3" style={{ color: 'var(--neu-danger)' }}>{error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="neu-btn neu-btn-accent neu-btn-sm">
            {saving ? 'Adding…' : 'Add Frame'}
          </button>
          <button type="button" onClick={onCancel} className="neu-btn neu-btn-raised neu-btn-sm">
            Cancel
          </button>
        </div>
      </form>
    </div>
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
      onUpdated(data); setEditing(false);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this frame?')) return;
    setDeleting(true);
    try { await apiClient.delete(`/admin/frames/${frame.id}`); onDeleted(frame.id); }
    finally { setDeleting(false); }
  };

  return (
    <div className="neu-card-sm">
      <div className="flex items-start gap-3">
        {/* Frame number */}
        <div className="neu-raised flex items-center justify-center w-7 h-7 rounded-lg shrink-0 text-xs font-bold"
             style={{ color: 'var(--neu-accent)', minWidth: '28px' }}>
          {index + 1}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {frame.frameTitle && (
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--neu-accent)' }}>
              {frame.frameTitle}
            </p>
          )}
          {editing ? (
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={3}
              autoFocus
              className="neu-textarea"
              style={{ fontSize: '13px' }}
            />
          ) : (
            <p className="text-sm leading-relaxed" style={{ color: 'var(--neu-text)' }}>
              {frame.contentText}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <TTSBadge status={frame.audioStatus} />
            <span className="neu-badge" style={{ fontSize: '10px' }}>
              {frame.layoutType?.replace('_', ' ') ?? 'concept'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 shrink-0">
          {editing ? (
            <>
              <button onClick={handleSave} disabled={saving}
                className="neu-btn neu-btn-accent neu-btn-sm">
                {saving ? '…' : 'Save'}
              </button>
              <button onClick={() => { setText(frame.contentText); setEditing(false); }}
                className="neu-btn neu-btn-raised neu-btn-sm">
                ✕
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)}
                className="neu-btn-icon neu-btn"
                title="Edit" style={{ fontSize: '14px' }}>
                ✏️
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="neu-btn-icon neu-btn"
                title="Delete" style={{ fontSize: '14px' }}>
                🗑️
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
