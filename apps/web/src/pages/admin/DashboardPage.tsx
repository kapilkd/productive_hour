import { useEffect, useState } from 'react';
import { apiClient } from '../../services/api.service';

interface Overview {
  totalStudents: number;
  totalSubjects: number;
  averageIqScore: number;
}

const stats = [
  { key: 'totalStudents',  label: 'Active Students', icon: '👥', sub: 'enrolled learners' },
  { key: 'totalSubjects',  label: 'Total Subjects',  icon: '📚', sub: 'published content' },
  { key: 'averageIqScore', label: 'Avg IQ Score',    icon: '🧠', sub: 'out of 100' },
];

export default function DashboardPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/admin/analytics/overview')
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  const getValue = (key: string) => {
    if (!data) return '—';
    const v = data[key as keyof Overview];
    return key === 'averageIqScore' ? `${v}` : v;
  };

  return (
    <div className="p-8 neu-page min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--neu-text)' }}>Dashboard</h1>
        <p className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>Platform overview</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-3" style={{ color: 'var(--neu-text-muted)' }}>
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Loading…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            {stats.map(s => (
              <div key={s.key} className="neu-stat-card">
                <span className="stat-icon">{s.icon}</span>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{getValue(s.key)}</div>
                <div className="stat-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="neu-card">
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--neu-text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '11px' }}>
              Quick Links
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                { href: '/admin/boards',    label: '📚  Manage Courses' },
                { href: '/admin/students',  label: '👥  Manage Students' },
                { href: '/admin/analytics', label: '📊  View Analytics' },
              ].map(l => (
                <a key={l.href} href={l.href} className="neu-btn neu-btn-raised neu-btn-sm">
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
