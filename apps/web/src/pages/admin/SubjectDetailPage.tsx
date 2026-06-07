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
    <div className="p-8">
      <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white text-sm mb-4 flex items-center gap-1">
        ← Back
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">{subjectName}</h1>
          <p className="text-gray-400 text-sm">Chapters</p>
        </div>
        <button
          onClick={() => setShowForm(f => !f)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {showForm ? 'Cancel' : '+ New Chapter'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-gray-900 rounded-xl p-5 mb-6 space-y-3">
          <h2 className="text-sm font-semibold text-white">New Chapter</h2>
          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Chapter title"
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
            required
          />
          <input
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Description (optional)"
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            {saving ? 'Creating…' : 'Create Chapter'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : chapters.length === 0 ? (
        <p className="text-gray-500">No chapters yet.</p>
      ) : (
        <div className="space-y-2">
          {chapters.map((chapter, idx) => (
            <div key={chapter.id} className="bg-gray-900 rounded-xl px-5 py-4 flex items-center justify-between">
              <div>
                <span className="text-gray-500 text-sm mr-3">#{idx + 1}</span>
                <span className="text-white font-medium">{chapter.title}</span>
                {chapter.description && (
                  <p className="text-gray-400 text-sm mt-0.5 ml-7">{chapter.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => navigate(`/admin/chapters/${chapter.id}`, { state: { chapterTitle: chapter.title } })}
                  className="text-indigo-400 hover:text-indigo-300 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Edit Frames →
                </button>
                <button
                  onClick={() => handleDelete(chapter.id)}
                  disabled={deleting === chapter.id}
                  className="text-red-400 hover:text-red-300 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
