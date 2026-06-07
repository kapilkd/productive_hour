import React, { useEffect, useState } from 'react';
import { apiClient } from '../../services/api.service';
import StudentTable from '../../components/admin/StudentTable';
import type { User } from '../../types';

export default function StudentsPage() {
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const load = () => {
    setLoading(true);
    apiClient.get('/admin/students')
      .then(r => setStudents(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { data } = await apiClient.post('/admin/students', form);
      setStudents(prev => [data, ...prev]);
      setForm({ name: '', email: '', password: '' });
      setShowForm(false);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to create student');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Students</h1>
          <p className="text-gray-400 text-sm">Manage student accounts and access</p>
        </div>
        <button
          onClick={() => setShowForm(f => !f)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {showForm ? 'Cancel' : '+ New Student'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-gray-900 rounded-xl p-5 mb-6 space-y-3">
          <h2 className="text-sm font-semibold text-white">New Student Account</h2>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Full name"
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
            required
          />
          <input
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="Email address"
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
            required
          />
          <input
            type="password"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            placeholder="Temporary password (min 6 chars)"
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
            required
            minLength={6}
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            {saving ? 'Creating…' : 'Create Student'}
          </button>
        </form>
      )}

      <div className="bg-gray-900 rounded-xl p-6">
        {loading ? (
          <p className="text-gray-500">Loading…</p>
        ) : (
          <StudentTable students={students} />
        )}
      </div>
    </div>
  );
}
