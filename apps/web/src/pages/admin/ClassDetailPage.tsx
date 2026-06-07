import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../../services/api.service';
import type { Subject } from '../../types';

export default function ClassDetailPage() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const className = (location.state as any)?.className ?? 'Class';

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
    <div className="p-8">
      <button onClick={() => navigate('/admin/classes')} className="text-gray-400 hover:text-white text-sm mb-4 flex items-center gap-1">
        ← Back to Classes
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">{className}</h1>
          <p className="text-gray-400 text-sm">Subjects in this class</p>
        </div>
        <button
          onClick={() => setShowForm(f => !f)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {showForm ? 'Cancel' : '+ New Subject'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-gray-900 rounded-xl p-5 mb-6 space-y-3">
          <h2 className="text-sm font-semibold text-white">New Subject</h2>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Subject name"
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
            required
          />
          <input
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Description (optional)"
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
          />
          <div className="flex gap-4 items-center">
            <label className="text-gray-400 text-sm">Ask question every</label>
            <input
              type="number"
              min="1"
              max="10"
              value={form.questionEveryNFrames}
              onChange={e => setForm(f => ({ ...f, questionEveryNFrames: e.target.value }))}
              className="w-16 bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-gray-400 text-sm">frames</span>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={form.sequentialChapters}
              onChange={e => setForm(f => ({ ...f, sequentialChapters: e.target.checked }))}
              className="accent-indigo-500"
            />
            Sequential chapter unlock
          </label>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            {saving ? 'Creating…' : 'Create Subject'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : subjects.length === 0 ? (
        <p className="text-gray-500">No subjects yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map(s => (
            <button
              key={s.id}
              onClick={() => navigate(`/admin/subjects/${s.id}`, { state: { subjectName: s.name } })}
              className="bg-gray-900 hover:bg-gray-800 rounded-xl p-5 text-left transition-colors group"
            >
              <p className="text-white font-semibold group-hover:text-indigo-300 transition-colors">{s.name}</p>
              {s.description && <p className="text-gray-400 text-sm mt-1">{s.description}</p>}
              <p className="text-gray-500 text-xs mt-2">Question every {s.questionEveryNFrames} frames</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
