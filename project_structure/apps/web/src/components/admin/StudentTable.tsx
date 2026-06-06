import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/api.service';
import { User } from '../../types';

export default function StudentTable() {
  const [students, setStudents] = useState<User[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    apiClient.get('/admin/students').then(({ data }) => setStudents(data));
  }, []);

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-gray-400 border-b border-gray-700 text-left">
          <th className="py-3 pr-4">Name</th>
          <th className="py-3 pr-4">Email</th>
          <th className="py-3 pr-4">Status</th>
          <th className="py-3">Actions</th>
        </tr>
      </thead>
      <tbody>
        {students.map((s) => (
          <tr key={s.id} className="border-b border-gray-800 hover:bg-gray-800/40">
            <td className="py-3 pr-4 text-white">{s.name}</td>
            <td className="py-3 pr-4 text-gray-400">{s.email}</td>
            <td className="py-3 pr-4">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  s.isActive ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'
                }`}
              >
                {s.isActive ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td className="py-3">
              <button
                onClick={() => navigate(`/admin/students/${s.id}`)}
                className="text-indigo-400 hover:text-indigo-300 text-xs"
              >
                Manage →
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
