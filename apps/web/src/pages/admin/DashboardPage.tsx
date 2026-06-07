import { useEffect, useState } from 'react';
import { apiClient } from '../../services/api.service';

interface Overview {
  totalStudents: number;
  totalSubjects: number;
  averageIqScore: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/admin/analytics/overview')
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Active Students', value: data?.totalStudents ?? 0 },
    { label: 'Total Subjects', value: data?.totalSubjects ?? 0 },
    { label: 'Avg IQ Score', value: data ? `${data.averageIqScore}/100` : '—' },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
      <p className="text-gray-400 text-sm mb-8">Platform overview</p>

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {stats.map(s => (
            <div key={s.label} className="bg-gray-900 rounded-xl p-6">
              <p className="text-gray-400 text-sm mb-1">{s.label}</p>
              <p className="text-3xl font-bold text-white">{s.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
