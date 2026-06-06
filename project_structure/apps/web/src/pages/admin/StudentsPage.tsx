import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { apiClient } from '../../services/api.service';
import StudentTable from '../../components/admin/StudentTable';

interface FormValues {
  name: string;
  email: string;
  password: string;
}

export default function StudentsPage() {
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<FormValues>();

  const onCreate = async (data: FormValues) => {
    await apiClient.post('/admin/students', data);
    reset();
    setShowForm(false);
    setRefreshKey((k) => k + 1); // triggers StudentTable re-fetch
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Students</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          + New Student
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit(onCreate)}
          className="bg-gray-800 rounded-xl p-5 mb-6 space-y-3 max-w-md"
        >
          <h2 className="text-sm font-semibold text-gray-300">Create Student Account</h2>
          <input
            {...register('name', { required: true })}
            placeholder="Full name"
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            {...register('email', { required: true })}
            type="email"
            placeholder="Email address"
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            {...register('password', { required: true, minLength: 8 })}
            type="password"
            placeholder="Temporary password (min 8 chars)"
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.password && (
            <p className="text-red-400 text-xs">Password must be at least 8 characters</p>
          )}
          <div className="flex gap-3">
            <button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-semibold">
              Create
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-gray-800 rounded-xl p-6">
        <StudentTable key={refreshKey} />
      </div>
    </div>
  );
}
