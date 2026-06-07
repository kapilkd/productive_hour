
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';

// ── Admin shell ───────────────────────────────────────────────────────────────

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/classes', label: 'Courses' },
  { to: '/admin/students', label: 'Students' },
  { to: '/admin/analytics', label: 'Analytics' },
];

export function AdminLayout() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      <nav className="w-56 bg-gray-900 flex flex-col p-4 gap-1 shrink-0">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-4 px-3">Admin</p>
        {adminLinks.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-indigo-700 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="mt-auto text-sm text-gray-500 hover:text-white px-3 py-2 text-left"
        >
          Logout
        </button>
      </nav>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

// ── Student shell ─────────────────────────────────────────────────────────────

export function StudentLayout() {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <span className="font-bold text-indigo-400 text-lg">LearnFlow</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{user?.name}</span>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="text-sm text-gray-500 hover:text-white"
          >
            Logout
          </button>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
