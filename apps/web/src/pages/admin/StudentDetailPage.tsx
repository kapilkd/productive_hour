import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../../services/api.service';
import type { User, Subject, StudentSubjectAccess } from '../../types';

interface ProgressRow {
  id: string;
  chapterId: string;
  status: string;
  chapter: {
    title: string;
    subject: { name: string };
  };
}

interface IqRow {
  id: string;
  score: number;
  subject: { id: string; name: string };
}

export default function StudentDetailPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const passedStudent = (location.state as any)?.student as User | undefined;

  const [student, setStudent] = useState<User | null>(passedStudent ?? null);
  const [allSubjects, setAllSubjects] = useState<(Subject & { class: { name: string } })[]>([]);
  const [access, setAccess] = useState<(StudentSubjectAccess & { subject: Subject })[]>([]);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [iqScores, setIqScores] = useState<IqRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [granting, setGranting] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const requests: Promise<any>[] = [
          apiClient.get('/admin/subjects'),
          apiClient.get(`/admin/students/${studentId}/progress`),
          apiClient.get(`/admin/students/${studentId}/access`),
        ];
        if (!student) requests.push(apiClient.get('/admin/students'));

        const results = await Promise.all(requests);
        setAllSubjects(results[0].data);
        setProgress(results[1].data.progress);
        setIqScores(results[1].data.iqScores);
        setAccess(results[2].data);
        if (!student && results[3]) {
          const found = results[3].data.find((u: User) => u.id === studentId);
          if (found) setStudent(found);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [studentId]);

  const handleGrant = async () => {
    if (!selectedSubjectId) return;
    setGranting(true);
    try {
      await apiClient.post(`/admin/students/${studentId}/access`, { subjectId: selectedSubjectId });
      const granted = allSubjects.find(s => s.id === selectedSubjectId);
      if (granted && !access.find(a => a.subjectId === selectedSubjectId)) {
        setAccess(prev => [...prev, { subject: granted as any, subjectId: selectedSubjectId, studentId: studentId!, id: selectedSubjectId, grantedBy: '', grantedAt: new Date() }]);
      }
      setSelectedSubjectId('');
    } finally {
      setGranting(false);
    }
  };

  const handleRevoke = async (subjectId: string) => {
    if (!confirm('Revoke access to this subject?')) return;
    setRevoking(subjectId);
    try {
      await apiClient.delete(`/admin/students/${studentId}/access/${subjectId}`);
      setAccess(prev => prev.filter(a => a.subjectId !== subjectId));
    } finally {
      setRevoking(null);
    }
  };

  const unassignedSubjects = allSubjects.filter(s => !access.find((a: any) => a.subjectId === s.id));

  if (loading) {
    return <div className="p-8"><p className="text-gray-500">Loading…</p></div>;
  }

  return (
    <div className="p-8 space-y-8 max-w-4xl">
      <div>
        <button onClick={() => navigate('/admin/students')} className="text-gray-400 hover:text-white text-sm mb-4 flex items-center gap-1">
          ← Back to Students
        </button>
        <h1 className="text-2xl font-bold text-white">{student?.name ?? 'Student'}</h1>
        <p className="text-gray-400 text-sm mt-1">{student?.email}</p>
      </div>

      {/* IQ Scores */}
      <section>
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">IQ Scores</h2>
        {iqScores.length === 0 ? (
          <p className="text-gray-500 text-sm">No IQ data yet — student hasn't answered any questions.</p>
        ) : (
          <div className="space-y-2">
            {iqScores.map(iq => (
              <div key={iq.id} className="bg-gray-900 rounded-xl px-5 py-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white text-sm">{iq.subject.name}</span>
                  <span className="text-indigo-400 font-semibold">{iq.score}/100</span>
                </div>
                <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${iq.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Subject Access */}
      <section>
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Subject Access</h2>
        <div className="bg-gray-900 rounded-xl p-5 space-y-4">
          {/* Grant */}
          <div className="flex gap-2">
            <select
              value={selectedSubjectId}
              onChange={e => setSelectedSubjectId(e.target.value)}
              className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select a subject to grant…</option>
              {unassignedSubjects.map(s => (
                <option key={s.id} value={s.id}>{s.class?.name} — {s.name}</option>
              ))}
            </select>
            <button
              onClick={handleGrant}
              disabled={!selectedSubjectId || granting}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              {granting ? 'Granting…' : 'Grant'}
            </button>
          </div>

          {/* Current access list */}
          {access.length === 0 ? (
            <p className="text-gray-500 text-sm">No subjects assigned yet.</p>
          ) : (
            <ul className="divide-y divide-gray-800">
              {access.map(a => (
                <li key={a.subjectId} className="flex items-center justify-between py-2.5">
                  <span className="text-gray-200 text-sm">{(a.subject as any)?.name ?? a.subjectId}</span>
                  <button
                    onClick={() => handleRevoke(a.subjectId)}
                    disabled={revoking === a.subjectId}
                    className="text-red-400 hover:text-red-300 text-sm disabled:opacity-50"
                  >
                    Revoke
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Chapter Progress */}
      <section>
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Chapter Progress</h2>
        {progress.length === 0 ? (
          <p className="text-gray-500 text-sm">No progress recorded yet.</p>
        ) : (
          <div className="bg-gray-900 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-800">
                  <th className="px-5 py-3 font-medium">Subject</th>
                  <th className="px-5 py-3 font-medium">Chapter</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {progress.map(p => (
                  <tr key={p.id}>
                    <td className="px-5 py-3 text-gray-400">{p.chapter.subject.name}</td>
                    <td className="px-5 py-3 text-white">{p.chapter.title}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        p.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        p.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-gray-700 text-gray-400'
                      }`}>
                        {p.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
