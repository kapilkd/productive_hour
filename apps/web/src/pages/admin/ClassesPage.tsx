import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/api.service';
import type { Class } from '../../types';

export default function ClassesPage() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get('/admin/classes')
      .then(r => setClasses(r.data))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    try {
      const { data } = await apiClient.post('/admin/classes', { name: name.trim(), description: description.trim() || undefined });
      setClasses(prev => [data, ...prev]);
      setName('');
      setDescription('');
      setShowForm(false);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to create class');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Courses</h1>
          <p className="text-gray-400 text-sm">Manage classes and subjects</p>
        </div>
        <button
          onClick={() => setShowForm(f => !f)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {showForm ? 'Cancel' : '+ New Class'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-gray-900 rounded-xl p-5 mb-6 space-y-3">
          <h2 className="text-sm font-semibold text-white">New Class</h2>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Class name (e.g. Grade 10)"
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
            required
          />
          <input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            {saving ? 'Creating…' : 'Create Class'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : classes.length === 0 ? (
        <p className="text-gray-500">No classes yet. Create one to get started.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map(cls => (
            <button
              key={cls.id}
              onClick={() => navigate(`/admin/classes/${cls.id}`, { state: { className: cls.name } })}
              className="bg-gray-900 hover:bg-gray-800 rounded-xl p-5 text-left transition-colors group"
            >
              <p className="text-white font-semibold group-hover:text-indigo-300 transition-colors">{cls.name}</p>
              {cls.description && <p className="text-gray-400 text-sm mt-1">{cls.description}</p>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
