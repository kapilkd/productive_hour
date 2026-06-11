import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../../services/api.service';
import type { Chapter } from '../../types';

export default function SubjectDetailPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const subjectName = (location.state as any)?.subjectName ?? 'Subject';

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', description: '' });

  useEffect(() => {
    apiClient.get(`/admin/subjects/${subjectId}/chapters`)
      .then(r => setChapters(r.data))
      .finally(() => setLoading(false));
  }, [subjectId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setError('');
    try {
      const { data } = await apiClient.post('/admin/chapters', {
        subjectId,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        orderIndex: chapters.length,
      });
      setChapters(prev => [...prev, data]);
      setForm({ title: '', description: '' });
      setShowForm(false);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to create chapter');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (chapterId: string) => {
    if (!confirm('Delete this chapter and all its frames?')) return;
    setDeleting(chapterId);
    try {
      await apiClient.delete(`/admin/chapters/${chapterId}`);
      setChapters(prev => prev.filter(c => c.id !== chapterId));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="p-8 neu-page min-h-screen" style={{ maxWidth: '860px' }}>
      <button onClick={() => navigate(-1)} className="neu-btn neu-btn-raised neu-btn-sm mb-6">
        ← Back
      </button>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--neu-text)', marginBottom: '4px' }}>{subjectName}</h1>
          <p style={{ fontSize: '13px', color: 'var(--neu-text-muted)' }}>
            {chapters.length} chapter{chapters.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => setShowForm(f => !f)} className="neu-btn neu-btn-raised">
          {showForm ? 'Cancel' : '+ New Chapter'}
        </button>
      </div>

      {showForm && (
        <div className="neu-card mb-6">
          <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--neu-text)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            New Chapter
          </h2>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="neu-input-group">
              <label className="neu-label">Chapter Title</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Introduction to Algebra"
                className="neu-input"
                required
              />
            </div>
            <div className="neu-input-group">
              <label className="neu-label">Description (optional)</label>
              <input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Brief description"
                className="neu-input"
              />
            </div>
            {error && <p style={{ fontSize: '12px', color: 'var(--neu-danger)' }}>{error}</p>}
            <button type="submit" disabled={saving} className="neu-btn neu-btn-accent" style={{ alignSelf: 'flex-start' }}>
              {saving ? 'Creating…' : 'Create Chapter'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--neu-text-muted)' }}>
          <div style={{ width: '18px', height: '18px', border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin" />
          Loading…
        </div>
      ) : chapters.length === 0 ? (
        <p style={{ color: 'var(--neu-text-muted)' }}>No chapters yet. Create the first one above.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {chapters.map((chapter, idx) => (
            <div key={chapter.id} className="neu-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                <div className="neu-raised" style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '13px', fontWeight: 700, color: 'var(--neu-text-muted)' }}>
                  {idx + 1}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 600, color: 'var(--neu-text)' }}>{chapter.title}</p>
                  {chapter.description && (
                    <p style={{ fontSize: '12px', color: 'var(--neu-text-muted)', marginTop: '2px' }}>{chapter.description}</p>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <button
                  onClick={() => navigate(`/admin/chapters/${chapter.id}`, { state: { chapterTitle: chapter.title } })}
                  className="neu-btn neu-btn-accent neu-btn-sm"
                >
                  Edit Frames →
                </button>
                <button
                  onClick={() => handleDelete(chapter.id)}
                  disabled={deleting === chapter.id}
                  className="neu-btn neu-btn-danger neu-btn-sm"
                >
                  {deleting === chapter.id ? '…' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
