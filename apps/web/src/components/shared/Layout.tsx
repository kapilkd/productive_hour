import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';

// ── Admin shell ───────────────────────────────────────────────────────────────

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard',  icon: '◈' },
  { to: '/admin/boards',    label: 'Courses',     icon: '📚' },
  { to: '/admin/students',  label: 'Students',    icon: '👥' },
  { to: '/admin/analytics', label: 'Analytics',   icon: '📊' },
];

export function AdminLayout() {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen" style={{ background: 'var(--neu-bg)' }}>
      {/* Sidebar */}
      <nav className="w-56 flex flex-col p-4 gap-1.5 shrink-0"
           style={{ boxShadow: '4px 0 15px var(--neu-shadow-dark)' }}>
        {/* Brand */}
        <div className="neu-card mb-4 text-center py-3 px-2">
          <p className="font-bold text-sm" style={{ color: 'var(--neu-accent)' }}>LearnFlow</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--neu-text-muted)' }}>Admin Panel</p>
        </div>

        {adminLinks.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) =>
            `neu-nav-link flex items-center gap-2.5 ${isActive ? 'neu-nav-link-active' : ''}`
          }>
            <span className="text-sm">{icon}</span>
            {label}
          </NavLink>
        ))}

        {/* User info + logout */}
        <div className="mt-auto">
          <hr className="neu-divider" />
          <div className="neu-card-sm mb-2">
            <p className="text-xs font-semibold truncate" style={{ color: 'var(--neu-text)' }}>{user?.name}</p>
            <p className="text-xs truncate" style={{ color: 'var(--neu-text-muted)' }}>{user?.email}</p>
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="neu-btn neu-btn-raised w-full text-xs"
            style={{ color: 'var(--neu-text-muted)' }}
          >
            Sign out
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

// ── Student shell ─────────────────────────────────────────────────────────────

const studentLinks = [
  { to: '/student/subjects', label: 'My Subjects' },
  { to: '/student/progress', label: 'Progress' },
];

export function StudentLayout() {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen neu-page">
      <header className="flex justify-between items-center px-6 py-3 sticky top-0 z-10"
              style={{ background: 'var(--neu-bg)', boxShadow: '0 4px 12px var(--neu-shadow-dark)' }}>
        <span className="font-bold text-base" style={{ color: 'var(--neu-accent)' }}>LearnFlow</span>
        <nav className="flex items-center gap-2">
          {studentLinks.map(({ to, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `neu-btn neu-btn-sm ${isActive ? 'neu-btn-accent' : 'neu-btn-raised'}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>{user?.name}</span>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="neu-btn neu-btn-raised neu-btn-sm"
          >
            Sign out
          </button>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
