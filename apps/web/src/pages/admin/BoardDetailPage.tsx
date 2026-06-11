import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../../services/api.service';
import type { Class } from '../../types';

export default function BoardDetailPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const boardName = (location.state as any)?.boardName ?? 'Board';

  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', description: '' });

  useEffect(() => {
    apiClient.get(`/admin/boards/${boardId}/classes`)
      .then(r => setClasses(r.data))
      .finally(() => setLoading(false));
  }, [boardId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true); setError('');
    try {
      const { data } = await apiClient.post('/admin/classes', {
        boardId, name: form.name.trim(),
        description: form.description.trim() || undefined,
      });
      setClasses(prev => [...prev, data]);
      setForm({ name: '', description: '' }); setShowForm(false);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to create class');
    } finally { setSaving(false); }
  };

  return (
    <div className="p-8 neu-page min-h-screen">
      <button onClick={() => navigate('/admin/boards')}
        className="neu-btn neu-btn-raised neu-btn-sm mb-6">
        ← Back to Boards
      </button>

      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="neu-badge mb-2">{boardName}</span>
          <h1 className="text-2xl font-bold mt-2 mb-1" style={{ color: 'var(--neu-text)' }}>Classes</h1>
          <p className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>Manage classes under {boardName}</p>
        </div>
        <button onClick={() => setShowForm(f => !f)} className="neu-btn neu-btn-accent">
          {showForm ? 'Cancel' : '+ New Class'}
        </button>
      </div>

      {showForm && (
        <div className="neu-card mb-6" style={{ maxWidth: '480px' }}>
          <p className="text-sm mb-4" style={{ color: 'var(--neu-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '11px', fontWeight: 600 }}>
            New Class
          </p>
          <form onSubmit={handleCreate}>
            <div className="neu-input-group">
              <label className="neu-label">Class Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Grade 10" className="neu-input" required />
            </div>
            <div className="neu-input-group">
              <label className="neu-label">Description (optional)</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Short description" className="neu-input" />
            </div>
            {error && <p className="text-sm mb-3" style={{ color: 'var(--neu-danger)' }}>{error}</p>}
            <button type="submit" disabled={saving} className="neu-btn neu-btn-accent">
              {saving ? 'Creating…' : 'Create Class'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-3" style={{ color: 'var(--neu-text-muted)' }}>
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Loading…
        </div>
      ) : classes.length === 0 ? (
        <p style={{ color: 'var(--neu-text-muted)' }}>No classes yet. Create one to get started.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map(cls => (
            <button
              key={cls.id}
              onClick={() => navigate(`/admin/classes/${cls.id}`, {
                state: { className: cls.name, boardId, boardName },
              })}
              className="neu-card text-left"
              style={{ cursor: 'pointer' }}
            >
              <div className="flex items-start justify-between mb-2">
                <p className="font-semibold" style={{ color: 'var(--neu-text)' }}>{cls.name}</p>
                <span className="neu-badge" style={{ fontSize: '11px' }}>
                  {cls._count?.subjects ?? 0} subj
                </span>
              </div>
              {cls.description && (
                <p className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>{cls.description}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
