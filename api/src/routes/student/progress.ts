import { Router, Response } from 'express';
import { Difficulty } from '@prisma/client';
import prisma from '../../lib/prisma';
import { AuthRequest } from '../../middleware/auth';
import { updateIqScore, getIqDelta } from '../../services/iq.service';

const router = Router();

// POST /student/progress/frame — mark frame as listened
router.post('/progress/frame', async (req: AuthRequest, res: Response) => {
  const { frameId } = req.body;
  const studentId = req.user!.id;

  const frame = await prisma.frame.findUnique({
    where: { id: frameId },
    include: { chapter: { include: { subject: true } } },
  });
  if (!frame) { res.status(404).json({ error: 'Frame not found' }); return; }

  await prisma.studentFrameProgress.upsert({
    where: { studentId_frameId: { studentId, frameId } },
    create: { studentId, frameId, listened: true, listenedAt: new Date() },
    update: { listened: true, listenedAt: new Date() },
  });

  await prisma.studentChapterProgress.upsert({
    where: { studentId_chapterId: { studentId, chapterId: frame.chapterId } },
    create: {
      studentId,
      chapterId: frame.chapterId,
      status: 'in_progress',
      lastFrameIndex: frame.orderIndex,
      startedAt: new Date(),
    },
    update: { lastFrameIndex: frame.orderIndex, status: 'in_progress' },
  });

  const subject = frame.chapter.subject;
  const shouldTrigger = (frame.orderIndex + 1) % subject.questionEveryNFrames === 0;

  // LLM: re-enable in Phase 3 Step 19
  // if (shouldTrigger) {
  //   triggerQuestion(studentId, frame, subject).catch(console.error);
  // }

  res.json({ success: true, shouldTriggerQuestion: shouldTrigger });
});

// GET /student/progress/chapter/:id
router.get('/progress/chapter/:id', async (req: AuthRequest, res: Response) => {
  const chapterId = req.params.id as string;
  const progress = await prisma.studentChapterProgress.findUnique({
    where: { studentId_chapterId: { studentId: req.user!.id, chapterId } },
  });
  res.json(progress ?? { status: 'not_started', lastFrameIndex: 0 });
});

// POST /student/questions/:id/respond
router.post('/questions/:id/respond', async (req: AuthRequest, res: Response) => {
  const { selectedOption } = req.body;
  const studentId = req.user!.id;
  const questionId = req.params.id as string;
  const start = Date.now();

  const question = await prisma.llmQuestion.findUnique({ where: { id: questionId } });
  if (!question) { res.status(404).json({ error: 'Question not found' }); return; }

  const isCorrect = selectedOption === question.correctOption;
  const difficulty = question.difficulty as Difficulty;
  const iqDelta = getIqDelta(isCorrect, difficulty);

  const chapter = await prisma.chapter.findUnique({ where: { id: question.chapterId } });
  if (!chapter) { res.status(500).json({ error: 'Data inconsistency' }); return; }

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

export default router;
