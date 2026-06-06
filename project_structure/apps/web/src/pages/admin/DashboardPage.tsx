import React, { useEffect, useState } from 'react';
import { apiClient } from '../../services/api.service';

interface Overview {
  totalStudents: number;
  totalSubjects: number;
  averageIqScore: number;
}

export default function DashboardPage() {
  const [overview, setOverview] = useState<Overview | null>(null);

  useEffect(() => {
    apiClient.get('/admin/analytics/overview').then(({ data }) => setOverview(data));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard label="Active Students" value={overview.totalStudents} />
          <StatCard label="Total Subjects" value={overview.totalSubjects} />
          <StatCard label="Avg IQ Score" value={overview.averageIqScore} />
        </div>
      )}

      {/* TODO Phase 4: most/least completed chapters, recent activity log */}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-3xl font-bold text-white mt-1">{value}</p>
    </div>
  );
}
