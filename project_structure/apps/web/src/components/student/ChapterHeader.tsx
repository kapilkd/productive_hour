import React from 'react';
import { Chapter } from '../../types';

interface Props {
  chapter: Chapter;
  currentFrame: number;
  totalFrames: number;
}

export default function ChapterHeader({ chapter, currentFrame, totalFrames }: Props) {
  const percent = totalFrames > 0 ? Math.round((currentFrame / totalFrames) * 100) : 0;

  return (
    <div className="px-6 pt-6 pb-3 border-b border-gray-800">
      <h1 className="text-lg font-semibold text-white truncate">{chapter.title}</h1>
      <div className="mt-3 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Frame {currentFrame + 1} / {totalFrames}
      </p>
    </div>
  );
}
