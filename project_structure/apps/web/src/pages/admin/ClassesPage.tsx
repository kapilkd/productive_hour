import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { apiClient } from '../../services/api.service';
import { Class } from '../../types';

interface FormValues {
  name: string;
  description: string;
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormValues>();
  const navigate = useNavigate();

  useEffect(() => {
    apiClient.get('/admin/classes').then(({ data }) => setClasses(data));
  }, []);

  const onCreate = async (data: FormValues) => {
    const { data: cls } = await apiClient.post('/admin/classes', data);
    setClasses((prev) => [cls, ...prev]);
    reset();
    setShowForm(false);
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Classes</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          + New Class
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit(onCreate)}
          className="bg-gray-800 rounded-xl p-5 mb-6 space-y-3"
        >
          <input
            {...register('name', { required: true })}
            placeholder="Class name (e.g. Grade 8)"
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            {...register('description')}
            placeholder="Description (optional)"
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-semibold"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {classes.length === 0 && (
          <p className="text-gray-400 text-sm">No classes yet. Create one to get started.</p>
        )}
        {classes.map((c) => (
          <button
            key={c.id}
            onClick={() => navigate(`/admin/classes/${c.id}`)}
            className="w-full bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-indigo-600 rounded-xl px-6 py-4 text-left transition-colors group"
          >
            <p className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
              {c.name}
            </p>
            {c.description && (
              <p className="text-gray-400 text-sm mt-0.5">{c.description}</p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
