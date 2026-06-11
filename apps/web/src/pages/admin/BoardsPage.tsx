import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/api.service';
import type { Board } from '../../types';

const boardMeta: Record<string, { icon: string; color: string }> = {
  CBSE:          { icon: '🏛️', color: '#818cf8' },
  ICSE:          { icon: '📐', color: '#4ade80' },
  'State Board': { icon: '🏫', color: '#fb923c' },
};

export default function BoardsPage() {
  const navigate = useNavigate();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get('/admin/boards')
      .then(r => setBoards(r.data))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true); setError('');
    try {
      const { data } = await apiClient.post('/admin/boards', {
        name: name.trim(), description: description.trim() || undefined,
      });
      setBoards(prev => [...prev, data]);
      setName(''); setDescription(''); setShowForm(false);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to create board');
    } finally { setSaving(false); }
  };

  return (
    <div className="p-8 neu-page min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--neu-text)' }}>Boards</h1>
          <p className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>Select a board to manage classes and subjects</p>
        </div>
        <button onClick={() => setShowForm(f => !f)} className="neu-btn neu-btn-accent">
          {showForm ? 'Cancel' : '+ New Board'}
        </button>
      </div>

      {showForm && (
        <div className="neu-card mb-6" style={{ maxWidth: '480px' }}>
          <p className="text-sm font-semibold mb-4" style={{ color: 'var(--neu-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '11px' }}>
            New Board
          </p>
          <form onSubmit={handleCreate}>
            <div className="neu-input-group">
              <label className="neu-label">Board Name</label>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. CBSE" className="neu-input" required />
            </div>
            <div className="neu-input-group">
              <label className="neu-label">Description (optional)</label>
              <input value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Short description" className="neu-input" />
            </div>
            {error && <p className="text-sm mb-3" style={{ color: 'var(--neu-danger)' }}>{error}</p>}
            <button type="submit" disabled={saving} className="neu-btn neu-btn-accent">
              {saving ? 'Creating…' : 'Create Board'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-3" style={{ color: 'var(--neu-text-muted)' }}>
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Loading…
        </div>
      ) : boards.length === 0 ? (
        <p style={{ color: 'var(--neu-text-muted)' }}>No boards yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map(board => {
            const meta = boardMeta[board.name] ?? { icon: '🏫', color: 'var(--neu-accent)' };
            return (
              <button
                key={board.id}
                onClick={() => navigate(`/admin/boards/${board.id}`, { state: { boardName: board.name } })}
                className="neu-card text-left group"
                style={{ cursor: 'pointer', transition: 'box-shadow 0.2s ease' }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="neu-raised flex items-center justify-center w-11 h-11 rounded-xl text-xl">
                    {meta.icon}
                  </div>
                  <div>
                    <p className="text-base font-bold" style={{ color: meta.color }}>{board.name}</p>
                    <p className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>
                      {board._count?.classes ?? 0} {board._count?.classes === 1 ? 'class' : 'classes'}
                    </p>
                  </div>
                </div>
                {board.description && (
                  <p className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>{board.description}</p>
                )}
                <div className="mt-3 pt-3 neu-divider">
                  <p className="text-xs font-semibold" style={{ color: 'var(--neu-accent)' }}>
                    Open →
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
