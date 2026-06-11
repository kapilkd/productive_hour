
import { useNavigate } from 'react-router-dom';
import type { User } from '../../types';

interface Props {
  students: User[];
}

export default function StudentTable({ students }: Props) {
  const navigate = useNavigate();

  if (students.length === 0) {
    return (
      <div className="neu-card" style={{ textAlign: 'center', padding: '32px' }}>
        <p style={{ fontSize: '28px', marginBottom: '10px' }}>👥</p>
        <p style={{ color: 'var(--neu-text-muted)', fontSize: '14px' }}>No students yet. Create the first one above.</p>
      </div>
    );
  }

  return (
    <div className="neu-card" style={{ padding: 0, overflow: 'hidden' }}>
      <table className="neu-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map(s => (
            <tr key={s.id}>
              <td style={{ fontWeight: 500, color: 'var(--neu-text)' }}>{s.name}</td>
              <td style={{ color: 'var(--neu-text-muted)' }}>{s.email}</td>
              <td>
                <span className={s.isActive ? 'neu-badge-success' : 'neu-badge'} style={{ fontSize: '10px' }}>
                  {s.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>
                <button
                  onClick={() => navigate(`/admin/students/${s.id}`, { state: { student: s } })}
                  className="neu-btn neu-btn-accent neu-btn-sm"
                >
                  Manage →
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
