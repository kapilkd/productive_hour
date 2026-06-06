import React, { useEffect, useState } from 'react';
import { apiClient } from '../../services/api.service';

interface Overview {
  totalStudents: number;
  totalSubjects: number;
  averageIqScore: number;
}

// TODO Phase 4: add per-chapter drop-off, per-subject enrollment, IQ trends charts
export default function AnalyticsPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/admin/analytics/overview').then(({ data }) => {
      setOverview(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-8 text-gray-400">Loading analytics…</div>;
  if (!overview) return null;

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>

      {/* Top-level stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <StatCard label="Active Students" value={overview.totalStudents} unit="" />
        <StatCard label="Total Subjects" value={overview.totalSubjects} unit="" />
        <StatCard label="Platform Avg IQ" value={overview.averageIqScore} unit="/ 100" />
      </div>

      {/* Placeholders for Phase 4 charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartPlaceholder title="IQ Score Distribution" description="Histogram of student IQ scores across all subjects — Phase 4" />
        <ChartPlaceholder title="Chapter Completion Rate" description="% of enrolled students who completed each chapter — Phase 4" />
        <ChartPlaceholder title="Drop-off Frame Analysis" description="Which frame index most students stop at per chapter — Phase 4" />
        <ChartPlaceholder title="Question Accuracy Trend" description="Correct answer % over time across the platform — Phase 4" />
      </div>
    </div>
  );
}

function StatCard({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-3xl font-bold text-white mt-1">
        {value}
        {unit && <span className="text-lg text-gray-400 font-normal ml-1">{unit}</span>}
      </p>
    </div>
  );
}

function ChartPlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-gray-800 border border-dashed border-gray-600 rounded-xl p-6 flex flex-col items-center justify-center text-center min-h-40">
      <p className="font-semibold text-gray-300">{title}</p>
      <p className="text-gray-500 text-xs mt-1">{description}</p>
    </div>
  );
}
