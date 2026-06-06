import React from 'react';
import { usePlayerStore } from '../../stores/player.store';

const RATES = [0.75, 1, 1.25, 1.5] as const;

export default function AudioController() {
  const { isPlaying, playbackRate, currentFrameIndex, frames, play, pause, goToFrame, setPlaybackRate } =
    usePlayerStore();

  return (
    <div className="flex items-center gap-4 mt-4" role="toolbar" aria-label="Audio controls">
      <button
        onClick={() => goToFrame(Math.max(0, currentFrameIndex - 1))}
        disabled={currentFrameIndex === 0}
        className="p-2 rounded-full hover:bg-gray-800 disabled:opacity-30 transition-colors"
        aria-label="Previous frame"
      >
        ⏮
      </button>

      <button
        onClick={isPlaying ? pause : play}
        className="p-4 bg-indigo-600 hover:bg-indigo-500 rounded-full text-xl transition-colors"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      <button
        onClick={() => goToFrame(Math.min(frames.length - 1, currentFrameIndex + 1))}
        disabled={currentFrameIndex >= frames.length - 1}
        className="p-2 rounded-full hover:bg-gray-800 disabled:opacity-30 transition-colors"
        aria-label="Next frame"
      >
        ⏭
      </button>

      <div className="flex gap-1 ml-auto">
        {RATES.map((r) => (
          <button
            key={r}
            onClick={() => setPlaybackRate(r)}
            className={`px-2 py-1 rounded text-sm font-mono transition-colors ${
              playbackRate === r ? 'bg-indigo-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
            }`}
            aria-pressed={playbackRate === r}
          >
            {r}×
          </button>
        ))}
      </div>
    </div>
  );
}
