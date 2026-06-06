import React, { useEffect, useState } from 'react';
import { apiClient } from '../../services/api.service';

// TODO Phase 4: IQ trend chart, chapter accuracy breakdown, streak counter
export default function ProgressPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // Aggregate from iq scores + chapter progress
    Promise.all([
      apiClient.get('/student/subjects'),
    ]).then(([subjectsRes]) => {
      setData({ subjects: subjectsRes.data });
    });
  }, []);

  if (!data) return <div className="p-6 text-gray-400">Loading progress…</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">My Progress</h1>
      <p className="text-gray-400 text-sm">Detailed analytics coming in Phase 4.</p>
    </div>
  );
}
