import React from 'react';
import { usePlayerStore } from '../../stores/player.store';
import AudioController from './AudioController';
import FrameProgressDots from './FrameProgressDots';

export default function FramePlayer() {
  const { frames, currentFrameIndex } = usePlayerStore();
  const frame = frames[currentFrameIndex];

  if (!frame) return null;

  return (
    <div className="flex flex-col flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
      {frame.imageUrl && (
        <img
          src={frame.imageUrl}
          alt=""
          className="rounded-xl mb-6 object-cover max-h-64 w-full"
        />
      )}

      {/* Frame text — large, readable */}
      <p className="text-xl leading-relaxed text-gray-100 flex-1" style={{ fontSize: 'clamp(18px, 2vw, 22px)' }}>
        {frame.contentText}
      </p>

      <FrameProgressDots total={frames.length} current={currentFrameIndex} />
      <AudioController />
    </div>
  );
}
