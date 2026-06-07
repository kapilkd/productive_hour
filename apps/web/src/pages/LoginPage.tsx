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
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <h1 className="text-2xl font-bold text-white mb-1">LearnFlow</h1>
        <p className="text-gray-400 text-sm mb-6">Sign in to continue</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input
            {...register('email', { required: true })}
            type="email"
            placeholder="Email address"
            autoComplete="email"
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
          />
          <input
            {...register('password', { required: true })}
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
          />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            {isSubmitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
