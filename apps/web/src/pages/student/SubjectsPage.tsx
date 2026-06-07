import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/api.service';
import { useProgressStore } from '../../stores/progress.store';
import type { Subject } from '../../types';

interface SubjectWithClass extends Subject {
  class: { id: string; name: string };
}

export default function SubjectsPage() {
  const navigate = useNavigate();
  const { iqScores, fetchProgress } = useProgressStore();
  const [subjects, setSubjects] = useState<SubjectWithClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/student/subjects').then(async r => {
      const list: SubjectWithClass[] = r.data;
      setSubjects(list);
      await Promise.all(list.map(s => fetchProgress(s.id)));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Loading subjects…</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-1">My Subjects</h1>
      <p className="text-gray-400 text-sm mb-8">Select a subject to start learning</p>

      {subjects.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500">No subjects assigned yet.</p>
          <p className="text-gray-600 text-sm mt-1">Contact your admin to get access.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map(s => (
            <button
              key={s.id}
              onClick={() => navigate(`/student/subjects/${s.id}`, { state: { subjectName: s.name } })}
              className="bg-gray-900 hover:bg-gray-800 rounded-2xl p-6 text-left transition-colors group"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{s.class.name}</p>
                  <h2 className="text-white font-semibold text-lg group-hover:text-indigo-300 transition-colors">{s.name}</h2>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-bold text-indigo-400">{iqScores[s.id] ?? 50}</p>
                  <p className="text-gray-500 text-xs">IQ</p>
                </div>
              </div>
              {s.description && <p className="text-gray-400 text-sm mt-2">{s.description}</p>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
