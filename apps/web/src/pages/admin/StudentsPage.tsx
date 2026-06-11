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
    apiClient.get('/admin/students').then(r => setStudents(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const { data } = await apiClient.post('/admin/students', form);
      setStudents(prev => [data, ...prev]);
      setForm({ name: '', email: '', password: '' }); setShowForm(false);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to create student');
    } finally { setSaving(false); }
  };

  return (
    <div className="p-8 neu-page min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--neu-text)' }}>Students</h1>
          <p className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>Manage student accounts and access</p>
        </div>
        <button onClick={() => setShowForm(f => !f)} className="neu-btn neu-btn-accent">
          {showForm ? 'Cancel' : '+ New Student'}
        </button>
      </div>

      {showForm && (
        <div className="neu-card mb-6" style={{ maxWidth: '480px' }}>
          <p className="mb-4" style={{ color: 'var(--neu-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '11px', fontWeight: 600 }}>
            New Student Account
          </p>
          <form onSubmit={handleCreate}>
            <div className="neu-input-group">
              <label className="neu-label">Full Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Jane Doe" className="neu-input" required />
            </div>
            <div className="neu-input-group">
              <label className="neu-label">Email Address</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="student@school.com" className="neu-input" required />
            </div>
            <div className="neu-input-group">
              <label className="neu-label">Temporary Password</label>
              <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Min 6 characters" className="neu-input" required minLength={6} />
            </div>
            {error && <p className="text-sm mb-3" style={{ color: 'var(--neu-danger)' }}>{error}</p>}
            <button type="submit" disabled={saving} className="neu-btn neu-btn-accent">
              {saving ? 'Creating…' : 'Create Student'}
            </button>
          </form>
        </div>
      )}

      <div className="neu-card">
        {loading ? (
          <div className="flex items-center gap-3" style={{ color: 'var(--neu-text-muted)' }}>
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Loading students…
          </div>
        ) : (
          <StudentTable students={students} />
        )}
      </div>
    </div>
  );
}
