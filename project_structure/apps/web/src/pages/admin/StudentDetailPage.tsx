import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/api.service';
import { Subject, StudentChapterProgress } from '../../types';

interface StudentProgress {
  progress: Array<StudentChapterProgress & { chapter: { title: string; subject: { name: string } } }>;
  iqScores: Array<{ subjectId: string; score: number; subject: { name: string } }>;
}

export default function StudentDetailPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<any>(null);
  const [progressData, setProgressData] = useState<StudentProgress | null>(null);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [grantSubjectId, setGrantSubjectId] = useState('');
  const [grantLoading, setGrantLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      apiClient.get('/admin/students').then(({ data }) => data.find((s: any) => s.id === studentId)),
      apiClient.get(`/admin/students/${studentId}/progress`),
      // Fetch all subjects to populate the access-grant dropdown
      apiClient.get('/admin/classes').then(async ({ data: classes }) => {
        const subjects: Subject[] = [];
        for (const cls of classes) {
          const { data } = await apiClient.get(`/admin/classes/${cls.id}/subjects`);
          subjects.push(...data);
        }
        return subjects;
      }),
    ]).then(([studentData, progressRes, subjects]) => {
      setStudent(studentData);
      setProgressData(progressRes.data);
      setAllSubjects(subjects);
    });
  }, [studentId]);

  const onGrantAccess = async () => {
    if (!grantSubjectId) return;
    setGrantLoading(true);
    await apiClient.post(`/admin/students/${studentId}/access`, { subjectId: grantSubjectId });
    setGrantLoading(false);
    setGrantSubjectId('');
    // Re-fetch progress to refresh IQ / enrolled subjects
    const res = await apiClient.get(`/admin/students/${studentId}/progress`);
    setProgressData(res.data);
  };

  const onRevokeAccess = async (subjectId: string) => {
    if (!confirm('Revoke access to this subject?')) return;
    await apiClient.delete(`/admin/students/${studentId}/access/${subjectId}`);
    const res = await apiClient.get(`/admin/students/${studentId}/progress`);
    setProgressData(res.data);
  };

  if (!student) {
    return <div className="p-8 text-gray-400">Loading…</div>;
  }

  return (
    <div className="p-8 max-w-3xl space-y-8">
      <button onClick={() => navigate('/admin/students')} className="text-gray-400 hover:text-white text-sm">
        ← Back to Students
      </button>

      {/* Student info */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h1 className="text-xl font-bold">{student.name}</h1>
        <p className="text-gray-400 text-sm mt-1">{student.email}</p>
        <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${student.isActive ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
          {student.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* IQ Scores per subject */}
      {progressData && progressData.iqScores.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="font-semibold mb-4">IQ Scores by Subject</h2>
          <div className="space-y-3">
            {progressData.iqScores.map((iq) => (
              <div key={iq.subjectId} className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">{iq.subject.name}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${iq.score}%` }} />
                  </div>
                  <span className="text-indigo-400 font-bold text-sm w-8 text-right">{iq.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grant subject access */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="font-semibold mb-4">Subject Access</h2>
        <div className="flex gap-3 mb-4">
          <select
            value={grantSubjectId}
            onChange={(e) => setGrantSubjectId(e.target.value)}
            className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select subject…</option>
            {allSubjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <button
            onClick={onGrantAccess}
            disabled={!grantSubjectId || grantLoading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-semibold"
          >
            Grant
          </button>
        </div>

        {progressData?.iqScores.length === 0 && (
          <p className="text-gray-400 text-sm">No subjects assigned yet.</p>
        )}
        <div className="space-y-2">
          {progressData?.iqScores.map((iq) => (
            <div key={iq.subjectId} className="flex items-center justify-between text-sm">
              <span className="text-gray-300">{iq.subject.name}</span>
              <button
                onClick={() => onRevokeAccess(iq.subjectId)}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chapter progress log */}
      {progressData && progressData.progress.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="font-semibold mb-4">Chapter Progress</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700 text-left">
                <th className="pb-2 pr-4">Subject</th>
                <th className="pb-2 pr-4">Chapter</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {progressData.progress.map((p) => (
                <tr key={p.id} className="border-b border-gray-700/50">
                  <td className="py-2 pr-4 text-gray-400">{p.chapter.subject.name}</td>
                  <td className="py-2 pr-4 text-white">{p.chapter.title}</td>
                  <td className="py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      p.status === 'completed' ? 'bg-green-900 text-green-300' :
                      p.status === 'in_progress' ? 'bg-yellow-900 text-yellow-300' :
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
    </div>
  );
}
