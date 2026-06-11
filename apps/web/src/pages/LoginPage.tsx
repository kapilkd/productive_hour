import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';

interface FormValues {
  email: string;
  password: string;
}

export default function LoginPage() {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>();
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const onSubmit = async (data: FormValues) => {
    setError('');
    try {
      await login(data.email, data.password);
      const role = useAuthStore.getState().user?.role;
      navigate(role === 'student' ? '/student' : '/admin', { replace: true });
    } catch {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen neu-page flex items-center justify-center p-6">
      <div style={{ width: '100%', maxWidth: '380px' }}>
        {/* Logo card */}
        <div className="neu-card text-center mb-6">
          <div className="neu-raised inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 text-2xl"
               style={{ color: 'var(--neu-accent)' }}>
            🎧
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--neu-text)' }}>LearnFlow</h1>
          <p className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>Adaptive learning platform</p>
        </div>

        {/* Login form */}
        <div className="neu-card">
          <p className="text-sm font-semibold mb-5" style={{ color: 'var(--neu-text-muted)' }}>
            SIGN IN TO CONTINUE
          </p>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="neu-input-group">
              <label className="neu-label">Email address</label>
              <input
                {...register('email', { required: true })}
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className="neu-input"
              />
            </div>

            <div className="neu-input-group">
              <label className="neu-label">Password</label>
              <input
                {...register('password', { required: true })}
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                className="neu-input"
              />
            </div>

            {error && (
              <p className="text-sm mb-4" style={{ color: 'var(--neu-danger)' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="neu-btn neu-btn-accent neu-btn-pill w-full"
              style={{ padding: '0.8rem', fontSize: '15px' }}
            >
              {isSubmitting ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
