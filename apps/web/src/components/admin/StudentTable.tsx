
import { useNavigate } from 'react-router-dom';
import type { User } from '../../types';

interface Props {
  students: User[];
}

export default function StudentTable({ students }: Props) {
  const navigate = useNavigate();

  if (students.length === 0) {
    return <p className="text-gray-500 text-sm">No students yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b border-gray-800">
            <th className="pb-3 pr-4 font-medium">Name</th>
            <th className="pb-3 pr-4 font-medium">Email</th>
            <th className="pb-3 pr-4 font-medium">Status</th>
            <th className="pb-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {students.map(s => (
            <tr key={s.id} className="hover:bg-gray-800/40 transition-colors">
              <td className="py-3 pr-4 text-white">{s.name}</td>
              <td className="py-3 pr-4 text-gray-400">{s.email}</td>
              <td className="py-3 pr-4">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  s.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
                }`}>
                  {s.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="py-3">
                <button
                  onClick={() => navigate(`/admin/students/${s.id}`, { state: { student: s } })}
                  className="text-indigo-400 hover:text-indigo-300 text-sm"
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
