import { create } from 'zustand';
import { Howl } from 'howler';
import { Chapter, Frame, LlmQuestion } from '../types';

interface PlayerState {
  chapter: Chapter | null;
  frames: Frame[];
  currentFrameIndex: number;
  isPlaying: boolean;
  playbackRate: number; // 0.75 | 1 | 1.25 | 1.5
  currentQuestion: LlmQuestion | null;
  questionPhase: boolean;
  howl: Howl | null;

  loadChapter: (chapter: Chapter, frames: Frame[], startIndex?: number) => void;
  play: () => void;
  pause: () => void;
  goToFrame: (index: number) => void;
  markFrameComplete: () => void;
  setPlaybackRate: (rate: number) => void;
  showQuestion: (question: LlmQuestion) => void;
  submitAnswer: (option: string) => void;
  dismissQuestion: () => void;
  reset: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  chapter: null,
  frames: [],
  currentFrameIndex: 0,
  isPlaying: false,
  playbackRate: 1,
  currentQuestion: null,
  questionPhase: false,
  howl: null,

  loadChapter: (chapter, frames, startIndex = 0) => {
    get().howl?.unload();
    set({ chapter, frames, currentFrameIndex: startIndex, isPlaying: false, howl: null });
  },

  play: () => {
    const { frames, currentFrameIndex, playbackRate } = get();
    const frame = frames[currentFrameIndex];
    if (!frame?.audioUrl) return;

    get().howl?.unload();

    const howl = new Howl({
      src: [frame.audioUrl],
      html5: true,
      rate: playbackRate,
      onend: () => get().markFrameComplete(),
      onloaderror: () => {
        console.error(`Audio load failed for frame ${frame.id}`);
        // Gracefully advance to next frame rather than blocking
        get().markFrameComplete();
      },
    });

    howl.play();
    set({ howl, isPlaying: true });
  },

  pause: () => {
    get().howl?.pause();
    set({ isPlaying: false });
  },

  goToFrame: (index) => {
    get().howl?.unload();
    set({ currentFrameIndex: index, isPlaying: false, howl: null });
  },

  markFrameComplete: () => {
    const { frames, currentFrameIndex } = get();
    const next = currentFrameIndex + 1;
    if (next < frames.length) {
      set({ currentFrameIndex: next, isPlaying: false, howl: null });
      setTimeout(() => get().play(), 300);
    } else {
      set({ isPlaying: false });
      // ChapterCompleteModal listens for frames.length === currentFrameIndex + 1
    }
  },

  setPlaybackRate: (rate) => {
    get().howl?.rate(rate);
    set({ playbackRate: rate });
  },

  showQuestion: (question) => {
    get().howl?.pause();
    set({ currentQuestion: question, questionPhase: true, isPlaying: false });
  },

  submitAnswer: (_option) => {
    // Called after API response; dismissQuestion() re-starts audio
  },

  dismissQuestion: () => {
    set({ currentQuestion: null, questionPhase: false });
    get().play();
  },

  reset: () => {
    get().howl?.unload();
    set({ chapter: null, frames: [], currentFrameIndex: 0, isPlaying: false, howl: null, currentQuestion: null, questionPhase: false });
  },
}));
