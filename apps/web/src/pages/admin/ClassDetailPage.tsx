import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../../services/api.service';
import type { Subject } from '../../types';

export default function ClassDetailPage() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const className = (location.state as any)?.className ?? 'Class';
  const boardId = (location.state as any)?.boardId as string | undefined;
  const boardName = (location.state as any)?.boardName as string | undefined;

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    description: '',
    questionEveryNFrames: '3',
    sequentialChapters: true,
  });

  useEffect(() => {
    apiClient.get(`/admin/classes/${classId}/subjects`)
      .then(r => setSubjects(r.data))
      .finally(() => setLoading(false));
  }, [classId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError('');
    try {
      const { data } = await apiClient.post('/admin/subjects', {
        classId,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        questionEveryNFrames: parseInt(form.questionEveryNFrames, 10) || 3,
        sequentialChapters: form.sequentialChapters,
      });
      setSubjects(prev => [...prev, data]);
      setForm({ name: '', description: '', questionEveryNFrames: '3', sequentialChapters: true });
      setShowForm(false);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to create subject');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 neu-page min-h-screen">
      <button
        onClick={() => boardId
          ? navigate(`/admin/boards/${boardId}`, { state: { boardName } })
          : navigate('/admin/boards')
        }
        className="neu-btn neu-btn-raised neu-btn-sm mb-6"
      >
        ← Back to {boardName ?? 'Boards'}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--neu-text)', marginBottom: '4px' }}>{className}</h1>
          <p style={{ fontSize: '13px', color: 'var(--neu-text-muted)' }}>Subjects in this class</p>
        </div>
        <button onClick={() => setShowForm(f => !f)} className="neu-btn neu-btn-raised">
          {showForm ? 'Cancel' : '+ New Subject'}
        </button>
      </div>

      {showForm && (
        <div className="neu-card mb-6">
          <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--neu-text)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            New Subject
          </h2>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="neu-input-group">
              <label className="neu-label">Subject Name</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Mathematics"
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label className="neu-label" style={{ margin: 0 }}>Ask question every</label>
              <input
                type="number"
                min="1"
                max="10"
                value={form.questionEveryNFrames}
                onChange={e => setForm(f => ({ ...f, questionEveryNFrames: e.target.value }))}
                className="neu-input"
                style={{ width: '72px' }}
              />
              <span style={{ fontSize: '13px', color: 'var(--neu-text-muted)' }}>frames</span>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <div
                className={`neu-toggle-track ${form.sequentialChapters ? 'neu-toggle-active' : ''}`}
                onClick={() => setForm(f => ({ ...f, sequentialChapters: !f.sequentialChapters }))}
              >
                <div className="neu-toggle-thumb" />
              </div>
              <span style={{ fontSize: '13px', color: 'var(--neu-text)' }}>Sequential chapter unlock</span>
            </label>
            {error && <p style={{ fontSize: '12px', color: 'var(--neu-danger)' }}>{error}</p>}
            <button type="submit" disabled={saving} className="neu-btn neu-btn-accent" style={{ alignSelf: 'flex-start' }}>
              {saving ? 'Creating…' : 'Create Subject'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--neu-text-muted)' }}>
          <div style={{ width: '18px', height: '18px', border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin" />
          Loading…
        </div>
      ) : subjects.length === 0 ? (
        <p style={{ color: 'var(--neu-text-muted)' }}>No subjects yet.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {subjects.map(s => (
            <button
              key={s.id}
              onClick={() => navigate(`/admin/subjects/${s.id}`, { state: { subjectName: s.name } })}
              className="neu-card"
              style={{ textAlign: 'left', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, color: 'var(--neu-text)', marginBottom: '4px' }}>{s.name}</p>
                  {s.description && (
                    <p style={{ fontSize: '12px', color: 'var(--neu-text-muted)', marginBottom: '8px' }}>{s.description}</p>
                  )}
                  <span className="neu-badge" style={{ fontSize: '10px' }}>
                    Q every {s.questionEveryNFrames} frames
                  </span>
                </div>
                <span style={{ color: 'var(--neu-accent)', fontSize: '16px', flexShrink: 0 }}>→</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
