// Domain types shared between api/ and apps/web/

export type Role = 'super_admin' | 'admin' | 'student';
export type AudioStatus = 'pending' | 'generating' | 'ready' | 'failed';
export type ProcessingStatus = 'idle' | 'processing' | 'done' | 'failed';
export type ChapterStatus = 'not_started' | 'in_progress' | 'completed';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type LayoutType = 'title' | 'concept' | 'definition' | 'image_focus' | 'split' | 'table_layout' | 'quote' | 'summary';

export interface Board {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  _count?: { classes: number };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
}

export interface Class {
  id: string;
  boardId?: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  _count?: { subjects: number };
}

export interface Subject {
  id: string;
  classId: string;
  name: string;
  description?: string;
  questionEveryNFrames: number;
  sequentialChapters: boolean;
  createdAt: Date;
}

export interface Chapter {
  id: string;
  subjectId: string;
  title: string;
  description?: string;
  orderIndex: number;
  sourcePdfUrl?: string;
  processingStatus: ProcessingStatus;
  processingError?: string;
  createdAt: Date;
}

export interface ContentBlocks {
  subtitle?: string;
  backgroundHint?: string;
  bullets?: string[];
  highlight?: string;
  term?: string;
  definition?: string;
  examples?: string[];
  caption?: string;
  description?: string;
  leftContent?: string;
  rightBullets?: string[];
  headers?: string[];
  rows?: string[][];
  quote?: string;
  attribution?: string;
  takeaways?: string[];
  callToAction?: string;
}

export interface Frame {
  id: string;
  chapterId: string;
  orderIndex: number;
  contentText: string;
  frameTitle?: string;
  layoutType: LayoutType;
  contentBlocks?: ContentBlocks;
  extractedImages?: { url: string; caption?: string }[];
  imageUrl?: string;
  audioUrl?: string;
  audioStatus: AudioStatus;
  durationSeconds?: number;
  createdAt: Date;
}

export interface StudentSubjectAccess {
  id: string;
  studentId: string;
  subjectId: string;
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
}

export interface StudentChapterProgress {
  id: string;
  studentId: string;
  chapterId: string;
  status: ChapterStatus;
  lastFrameIndex: number;
  startedAt?: Date;
  completedAt?: Date;
}

export interface StudentFrameProgress {
  id: string;
  studentId: string;
  frameId: string;
  listened: boolean;
  listenedAt?: Date;
}

export interface StudentIqScore {
  id: string;
  studentId: string;
  subjectId: string;
  score: number;
  updatedAt: Date;
}

export interface QuestionOption {
  label: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface LlmQuestion {
  id: string;
  studentId: string;
  chapterId: string;
  triggerFrameIndex: number;
  questionText: string;
  options: QuestionOption[];
  correctOption: string;
  difficulty: Difficulty;
  askedAt: Date;
}

export interface StudentQuestionResponse {
  id: string;
  questionId: string;
  studentId: string;
  selectedOption: string;
  isCorrect: boolean;
  iqDelta: number;
  responseTimeSeconds?: number;
  respondedAt: Date;
}

// Shape returned by the LLM (before persisting to DB)
export interface LlmQuestionPayload {
  question: string;
  options: QuestionOption[];
  correct: string;
  difficulty: Difficulty;
  boost_message: string;
}
