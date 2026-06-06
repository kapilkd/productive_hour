import React from 'react';
import { useParams } from 'react-router-dom';
import { usePlayerStore } from '../../stores/player.store';
import { useChapterLoader } from '../../hooks/useAudio';
import ChapterHeader from '../../components/student/ChapterHeader';
import FramePlayer from '../../components/student/FramePlayer';
import QuestionOverlay from '../../components/student/QuestionOverlay';
import ChapterCompleteModal from '../../components/student/ChapterCompleteModal';

export default function ListenPage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const { chapter, frames, currentFrameIndex, questionPhase } = usePlayerStore();

  useChapterLoader(chapterId!);

  const isComplete = frames.length > 0 && currentFrameIndex >= frames.length;

  if (!chapter) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950 text-gray-400">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <ChapterHeader
        chapter={chapter}
        currentFrame={currentFrameIndex}
        totalFrames={frames.length}
      />

      <FramePlayer />

      {questionPhase && <QuestionOverlay />}

      {isComplete && (
        <ChapterCompleteModal
          subjectId={chapter.subjectId}
          // TODO: pass nextChapterId from subject chapter list
        />
      )}
    </div>
  );
}
