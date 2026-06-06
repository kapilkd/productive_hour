import React from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {
  subjectId: string;
  nextChapterId?: string;
}

export default function ChapterCompleteModal({ subjectId, nextChapterId }: Props) {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-gray-950/90 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl p-10 max-w-md mx-4 text-center shadow-2xl">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-white mb-2">Chapter Complete!</h2>
        <p className="text-gray-400 mb-8">Great work. Keep the momentum going!</p>

        {nextChapterId ? (
          <button
            onClick={() => navigate(`/student/chapters/${nextChapterId}/listen`)}
            className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-semibold text-white transition-colors"
          >
            Next Chapter →
          </button>
        ) : (
          <button
            onClick={() => navigate(`/student/subjects/${subjectId}`)}
            className="w-full bg-gray-700 hover:bg-gray-600 py-3 rounded-xl font-semibold text-white transition-colors"
          >
            Back to Subject
          </button>
        )}
      </div>
    </div>
  );
}
