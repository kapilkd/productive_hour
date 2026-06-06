import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { apiClient } from '../../services/api.service';
import { Chapter, Subject } from '../../types';

interface FormValues {
  title: string;
  description: string;
}

export default function SubjectDetailPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormValues>();

  useEffect(() => {
    Promise.all([
      apiClient.get(`/admin/subjects/${subjectId}/chapters`),
      // Subject metadata — infer from the first chapter or pass via state; for now fetch class list
      // TODO: add GET /admin/subjects/:id endpoint to avoid this
    ]).then(([chaptersRes]) => {
      setChapters(chaptersRes.data);
    });
  }, [subjectId]);

  const onCreate = async (data: FormValues) => {
    const nextOrder = chapters.length; // append at the end
    const { data: chapter } = await apiClient.post('/admin/chapters', {
      ...data,
      subjectId,
      orderIndex: nextOrder,
    });
    setChapters((prev) => [...prev, chapter]);
    reset();
    setShowForm(false);
  };

  const onDelete = async (chapterId: string) => {
    if (!confirm('Delete this chapter?')) return;
    await apiClient.delete(`/admin/chapters/${chapterId}`);
    setChapters((prev) => prev.filter((c) => c.id !== chapterId));
  };

  return (
    <div className="p-8 max-w-4xl">
      <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white text-sm mb-4">
        ← Back
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Chapters</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          + New Chapter
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onCreate)} className="bg-gray-800 rounded-xl p-5 mb-6 space-y-3">
          <input
            {...register('title', { required: true })}
            placeholder="Chapter title"
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            {...register('description')}
            placeholder="Description (optional)"
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
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

      <div className="space-y-2">
        {chapters.length === 0 && <p className="text-gray-400 text-sm">No chapters yet.</p>}
        {chapters
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((ch, i) => (
            <div
              key={ch.id}
              className="flex items-center bg-gray-800 border border-gray-700 rounded-xl px-5 py-4 gap-4"
            >
              <span className="text-gray-600 font-mono text-sm w-6 shrink-0">{i + 1}</span>
              <button
                className="flex-1 text-left hover:text-indigo-300 transition-colors font-medium"
                onClick={() => navigate(`/admin/chapters/${ch.id}`)}
              >
                {ch.title}
              </button>
              <button
                onClick={() => onDelete(ch.id)}
                className="text-xs text-gray-500 hover:text-red-400 transition-colors px-2"
              >
                Delete
              </button>
              <button
                onClick={() => navigate(`/admin/chapters/${ch.id}`)}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Edit Frames →
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}
