import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/api.service';
import { useProgressStore } from '../../stores/progress.store';
import { Subject } from '../../types';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const { iqScores, fetchProgress } = useProgressStore();
  const navigate = useNavigate();

  useEffect(() => {
    apiClient.get('/student/subjects').then(({ data }) => {
      setSubjects(data);
      data.forEach((s: Subject) => fetchProgress(s.id));
    });
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">My Subjects</h1>

      {subjects.length === 0 && (
        <p className="text-gray-400">No subjects assigned yet. Ask your admin for access.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((s) => (
          <button
            key={s.id}
            onClick={() => navigate(`/student/subjects/${s.id}`)}
            className="bg-gray-900 rounded-xl p-6 text-left hover:bg-gray-800 transition-colors group"
          >
            <h2 className="font-semibold text-lg text-white group-hover:text-indigo-300 transition-colors">
              {s.name}
            </h2>
            {s.description && (
              <p className="text-gray-400 text-sm mt-1 line-clamp-2">{s.description}</p>
            )}
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-gray-500">IQ Score</span>
              <span className="text-indigo-400 font-bold">{iqScores[s.id] ?? 50}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
