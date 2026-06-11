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
      <div className="p-8 flex items-center gap-3" style={{ color: 'var(--neu-text-muted)' }}>
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        Loading subjects…
      </div>
    );
  }

  return (
    <div className="p-8 neu-page min-h-screen">
      <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--neu-text)' }}>My Subjects</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--neu-text-muted)' }}>Select a subject to start learning</p>

      {subjects.length === 0 ? (
        <div className="neu-card text-center py-12">
          <p className="text-4xl mb-4">📭</p>
          <p style={{ color: 'var(--neu-text-muted)' }}>No subjects assigned yet.</p>
          <p className="text-sm mt-1" style={{ color: 'var(--neu-text-muted)', opacity: 0.7 }}>
            Contact your admin to get access.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map(s => {
            const iq = iqScores[s.id] ?? 50;
            const iqColor = iq >= 70 ? 'var(--neu-success)' : iq >= 40 ? 'var(--neu-accent)' : 'var(--neu-warn)';
            return (
              <button
                key={s.id}
                onClick={() => navigate(`/student/subjects/${s.id}`, { state: { subjectName: s.name } })}
                className="neu-card text-left"
                style={{ cursor: 'pointer' }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0 mr-3">
                    <span className="neu-badge mb-2" style={{ display: 'inline-flex' }}>
                      {s.class.name}
                    </span>
                    <h2 className="text-base font-bold mt-1" style={{ color: 'var(--neu-text)' }}>{s.name}</h2>
                  </div>
                  {/* IQ circle */}
                  <div className="neu-raised flex flex-col items-center justify-center w-14 h-14 rounded-2xl shrink-0">
                    <p className="text-lg font-bold leading-none" style={{ color: iqColor }}>{iq}</p>
                    <p className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>IQ</p>
                  </div>
                </div>
                {s.description && (
                  <p className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>{s.description}</p>
                )}
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--neu-shadow-lite)' }}>
                  <p className="text-xs font-semibold" style={{ color: 'var(--neu-accent)' }}>
                    Start learning →
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
