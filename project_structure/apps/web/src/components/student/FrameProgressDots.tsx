import React from 'react';

interface Props {
  total: number;
  current: number;
}

export default function FrameProgressDots({ total, current }: Props) {
  return (
    <div className="flex gap-1.5 flex-wrap my-4" aria-label={`Frame ${current + 1} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`w-2 h-2 rounded-full transition-colors ${
            i <= current ? 'bg-indigo-400' : 'bg-gray-700'
          }`}
        />
      ))}
    </div>
  );
}
