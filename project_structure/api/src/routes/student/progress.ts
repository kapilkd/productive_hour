import { Router, Response } from 'express';
import prisma from '../../lib/prisma';
import { AuthRequest } from '../../middleware/auth';
import { generateQuestion, getDifficultyFromIq } from '../../services/llm.service';
import { updateIqScore, getIqDelta } from '../../services/iq.service';
import { Difficulty } from '../../../../shared/types';

const router = Router();

// POST /student/progress/frame  — mark a frame as listened; optionally triggers LLM question
router.post('/frame', async (req: AuthRequest, res: Response) => {
  const { frameId } = req.body;
  const studentId = req.user!.id;

  const frame = await prisma.frame.findUnique({
    where: { id: frameId },
    include: { chapter: { include: { subject: true } } },
  });
  if (!frame) return res.status(404).json({ error: 'Frame not found' });

  await prisma.studentFrameProgress.upsert({
    where: { studentId_frameId: { studentId, frameId } },
    create: { studentId, frameId, listened: true, listenedAt: new Date() },
    update: { listened: true, listenedAt: new Date() },
  });

  await prisma.studentChapterProgress.upsert({
    where: { studentId_chapterId: { studentId, chapterId: frame.chapterId } },
    create: { studentId, chapterId: frame.chapterId, status: 'in_progress', lastFrameIndex: frame.orderIndex, startedAt: new Date() },
    update: { lastFrameIndex: frame.orderIndex, status: 'in_progress' },
  });

  const subject = frame.chapter.subject;
  const shouldTrigger = (frame.orderIndex + 1) % subject.questionEveryNFrames === 0;

  if (shouldTrigger) {
    // Fire and forget — never block the audio loop
    triggerQuestion(studentId, frame, subject).catch(console.error);
  }

  res.json({ success: true, shouldTriggerQuestion: shouldTrigger });
});

// GET /student/progress/chapter/:id
router.get('/chapter/:id', async (req: AuthRequest, res: Response) => {
  const progress = await prisma.studentChapterProgress.findUnique({
    where: { studentId_chapterId: { studentId: req.user!.id, chapterId: req.params.id } },
  });
  res.json(progress ?? { status: 'not_started', lastFrameIndex: 0 });
});

// POST /student/questions/:id/respond
router.post('/questions/:id/respond', async (req: AuthRequest, res: Response) => {
  const { selectedOption } = req.body;
  const studentId = req.user!.id;
  const start = Date.now();

  const question = await prisma.llmQuestion.findUnique({ where: { id: req.params.id } });
  if (!question) return res.status(404).json({ error: 'Question not found' });

  const isCorrect = selectedOption === question.correctOption;
  const difficulty = question.difficulty as Difficulty;
  const iqDelta = getIqDelta(isCorrect, difficulty);

  // Need subjectId — fetch via chapter
  const chapter = await prisma.chapter.findUnique({ where: { id: question.chapterId } });
  if (!chapter) return res.status(500).json({ error: 'Data inconsistency' });

  const existing = await prisma.studentIqScore.findUnique({
    where: { studentId_subjectId: { studentId, subjectId: chapter.subjectId } },
  });
  const newScore = updateIqScore(existing?.score ?? 50, isCorrect, difficulty);

  await Promise.all([
    prisma.studentQuestionResponse.create({
      data: {
        questionId: question.id,
        studentId,
        selectedOption,
        isCorrect,
        iqDelta,
        responseTimeSeconds: (Date.now() - start) / 1000,
      },
    }),
    prisma.studentIqScore.upsert({
      where: { studentId_subjectId: { studentId, subjectId: chapter.subjectId } },
      create: { studentId, subjectId: chapter.subjectId, score: newScore },
      update: { score: newScore },
    }),
  ]);

  res.json({ isCorrect, iqDelta, newScore });
});

async function triggerQuestion(studentId: string, frame: any, subject: any) {
  const iq = await prisma.studentIqScore.findUnique({
    where: { studentId_subjectId: { studentId, subjectId: subject.id } },
  });
  const iqScore = iq?.score ?? 50;

  // Fetch the last N frames leading up to this one
  const recentFrames = await prisma.frame.findMany({
    where: {
      chapterId: frame.chapterId,
      orderIndex: { lte: frame.orderIndex },
    },
    orderBy: { orderIndex: 'asc' },
    take: subject.questionEveryNFrames,
  });

  const payload = await generateQuestion({
    iqScore,
    chapterTitle: frame.chapter.title,
    recentFrames: recentFrames.map((f: any) => ({ contentText: f.contentText })),
  });

  if (!payload) return; // Generation failed — skip gracefully

  await prisma.llmQuestion.create({
    data: {
      studentId,
      chapterId: frame.chapterId,
      triggerFrameIndex: frame.orderIndex,
      questionText: payload.question,
      options: payload.options,
      correctOption: payload.correct,
      difficulty: getDifficultyFromIq(iqScore),
    },
  });
}

export default router;
