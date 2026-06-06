import React, { useState } from 'react';
import { usePlayerStore } from '../../stores/player.store';
import { useAnswerQuestion } from '../../hooks/usePlayer';

export default function QuestionOverlay() {
  const { currentQuestion, dismissQuestion } = usePlayerStore();
  const answerQuestion = useAnswerQuestion();

  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<{ isCorrect: boolean; iqDelta: number } | null>(null);

  if (!currentQuestion) return null;

  const handleAnswer = async (option: string) => {
    if (selected) return; // prevent double-tap
    setSelected(option);
    const data = await answerQuestion(option);
    if (data) setResult({ isCorrect: data.isCorrect, iqDelta: data.iqDelta });
  };

  return (
    <div className="fixed inset-0 bg-gray-950/90 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-gray-900 rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl">
        <p className="text-xs text-indigo-400 uppercase tracking-widest mb-3">Quick Check</p>
        <h2 className="text-xl font-semibold text-white mb-6 leading-snug">
          {currentQuestion.questionText}
        </h2>

        <div className="grid grid-cols-1 gap-3">
          {currentQuestion.options.map((opt) => {
            const isSelected = selected === opt.label;
            const isCorrectAnswer = result !== null && opt.label === currentQuestion.correctOption;
            const isWrong = isSelected && result !== null && !result.isCorrect;

            return (
              <button
                key={opt.label}
                onClick={() => handleAnswer(opt.label)}
                disabled={!!selected}
                className={`p-4 rounded-xl text-left transition-colors text-sm ${
                  isCorrectAnswer
                    ? 'bg-green-700 text-white'
                    : isWrong
                    ? 'bg-red-700 text-white'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-200 disabled:hover:bg-gray-800'
                }`}
              >
                <span className="font-bold mr-3 text-indigo-300">{opt.label}.</span>
                {opt.text}
              </button>
            );
          })}
        </div>

        {result && (
          <div className="mt-5 pt-4 border-t border-gray-700">
            <p className={`font-semibold ${result.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
              {result.isCorrect ? '✓ Correct!' : '✗ Not quite.'}{' '}
              <span className="text-gray-400 font-normal text-sm">
                ({result.iqDelta > 0 ? '+' : ''}{result.iqDelta} IQ)
              </span>
            </p>
            <button
              onClick={dismissQuestion}
              className="mt-4 w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-semibold text-white transition-colors"
            >
              Continue →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
