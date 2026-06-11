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
    return (
      <div className="neu-page p-8" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '24px', height: '24px', border: '2px solid var(--neu-accent)', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin" />
        <span style={{ color: 'var(--neu-text-muted)' }}>Loading student…</span>
      </div>
    );
  }

  return (
    <div className="p-8 neu-page min-h-screen" style={{ maxWidth: '860px' }}>
      {/* Header */}
      <button onClick={() => navigate('/admin/students')} className="neu-btn neu-btn-raised neu-btn-sm mb-6">
        ← Back to Students
      </button>
      <div className="neu-card mb-8" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div className="neu-raised" style={{ width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
          👤
        </div>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--neu-text)' }}>{student?.name ?? 'Student'}</h1>
          <p style={{ fontSize: '13px', color: 'var(--neu-text-muted)', marginTop: '2px' }}>{student?.email}</p>
          <span className={student?.isActive ? 'neu-badge-success' : 'neu-badge'} style={{ fontSize: '10px', marginTop: '8px', display: 'inline-flex' }}>
            {student?.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* IQ Scores */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--neu-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
          IQ Scores per Subject
        </h2>
        {iqScores.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--neu-text-muted)' }}>No IQ data yet — student hasn't answered any questions.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {iqScores.map(iq => {
              const iqColor = iq.score >= 70 ? 'var(--neu-success)' : iq.score >= 40 ? 'var(--neu-accent)' : 'var(--neu-warn)';
              return (
                <div key={iq.id} className="neu-card-sm" style={{ padding: '14px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--neu-text)', fontWeight: 500 }}>{iq.subject.name}</span>
                    <span style={{ fontWeight: 700, color: iqColor, fontSize: '15px' }}>{iq.score}/100</span>
                  </div>
                  <div className="neu-progress-track" style={{ height: '6px' }}>
                    <div className="neu-progress-fill" style={{ width: `${iq.score}%`, background: iqColor }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Subject Access */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--neu-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
          Subject Access
        </h2>
        <div className="neu-card">
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <select
              value={selectedSubjectId}
              onChange={e => setSelectedSubjectId(e.target.value)}
              className="neu-select"
              style={{ flex: 1 }}
            >
              <option value="">Select a subject to grant…</option>
              {unassignedSubjects.map(s => (
                <option key={s.id} value={s.id}>{s.class?.name} — {s.name}</option>
              ))}
            </select>
            <button
              onClick={handleGrant}
              disabled={!selectedSubjectId || granting}
              className="neu-btn neu-btn-accent"
            >
              {granting ? 'Granting…' : 'Grant'}
            </button>
          </div>

          {access.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--neu-text-muted)' }}>No subjects assigned yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {access.map((a, i) => (
                <div key={a.subjectId}>
                  {i > 0 && <div className="neu-divider" style={{ margin: '0' }} />}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
                    <span style={{ fontSize: '13px', color: 'var(--neu-text)' }}>{(a.subject as any)?.name ?? a.subjectId}</span>
                    <button
                      onClick={() => handleRevoke(a.subjectId)}
                      disabled={revoking === a.subjectId}
                      className="neu-btn neu-btn-danger neu-btn-sm"
                    >
                      {revoking === a.subjectId ? '…' : 'Revoke'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Chapter Progress */}
      <section>
        <h2 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--neu-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
          Chapter Progress
        </h2>
        {progress.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--neu-text-muted)' }}>No progress recorded yet.</p>
        ) : (
          <div className="neu-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="neu-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Chapter</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {progress.map(p => (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--neu-text-muted)' }}>{p.chapter.subject.name}</td>
                    <td style={{ color: 'var(--neu-text)', fontWeight: 500 }}>{p.chapter.title}</td>
                    <td>
                      <span className={
                        p.status === 'completed' ? 'neu-badge-success' :
                        p.status === 'in_progress' ? 'neu-badge-info' :
                        'neu-badge'
                      } style={{ fontSize: '10px' }}>
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
