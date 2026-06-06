import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { apiClient } from '../../services/api.service';
import { Subject } from '../../types';

interface FormValues {
  name: string;
  description: string;
  questionEveryNFrames: number;
  sequentialChapters: boolean;
}

export default function ClassDetailPage() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [className, setClassName] = useState('');
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: { questionEveryNFrames: 3, sequentialChapters: true },
  });

  useEffect(() => {
    Promise.all([
      apiClient.get(`/admin/classes/${classId}/subjects`),
      // Derive class name from the classes list (no dedicated GET /classes/:id endpoint yet)
      apiClient.get('/admin/classes'),
    ]).then(([subjectsRes, classesRes]) => {
      setSubjects(subjectsRes.data);
      const cls = classesRes.data.find((c: any) => c.id === classId);
      if (cls) setClassName(cls.name);
    });
  }, [classId]);

  const onCreate = async (data: FormValues) => {
    const { data: subject } = await apiClient.post('/admin/subjects', { ...data, classId });
    setSubjects((prev) => [...prev, subject]);
    reset({ questionEveryNFrames: 3, sequentialChapters: true });
    setShowForm(false);
  };

  return (
    <div className="p-8 max-w-4xl">
      <button onClick={() => navigate('/admin/classes')} className="text-gray-400 hover:text-white text-sm mb-4">
        ← Back to Classes
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{className || 'Class'}</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          + New Subject
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit(onCreate)}
          className="bg-gray-800 rounded-xl p-5 mb-6 space-y-3"
        >
          <input
            {...register('name', { required: true })}
            placeholder="Subject name (e.g. Mathematics)"
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            {...register('description')}
            placeholder="Description (optional)"
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex gap-4 items-center flex-wrap">
            <label className="text-sm text-gray-400 flex items-center gap-2">
              Question every
              <input
                {...register('questionEveryNFrames', { valueAsNumber: true, min: 1 })}
                type="number"
                className="w-16 bg-gray-700 text-white rounded-lg px-3 py-1.5 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              frames
            </label>
            <label className="text-sm text-gray-400 flex items-center gap-2 cursor-pointer">
              <input {...register('sequentialChapters')} type="checkbox" className="accent-indigo-500" />
              Sequential chapters
            </label>
          </div>
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

      <div className="space-y-3">
        {subjects.length === 0 && (
          <p className="text-gray-400 text-sm">No subjects yet.</p>
        )}
        {subjects.map((s) => (
          <button
            key={s.id}
            onClick={() => navigate(`/admin/subjects/${s.id}`)}
            className="w-full bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-indigo-600 rounded-xl px-6 py-4 text-left transition-colors group"
          >
            <p className="font-semibold text-white group-hover:text-indigo-300 transition-colors">{s.name}</p>
            <p className="text-gray-500 text-xs mt-1">
              Question every {s.questionEveryNFrames} frames · {s.sequentialChapters ? 'Sequential' : 'Free navigation'}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
