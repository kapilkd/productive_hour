import { Router, Response } from 'express';
import prisma from '../../lib/prisma';
import { AuthRequest } from '../../middleware/auth';

const router = Router();

// GET /student/subjects/:id/chapters  — chapter list with the student's progress status merged in
router.get('/subjects/:id/chapters', async (req: AuthRequest, res: Response) => {
  const chapters = await prisma.chapter.findMany({
    where: { subjectId: req.params.id, deletedAt: null },
    orderBy: { orderIndex: 'asc' },
  });

  const progressRecords = await prisma.studentChapterProgress.findMany({
    where: { studentId: req.user!.id, chapterId: { in: chapters.map((c) => c.id) } },
  });

  const progressMap = Object.fromEntries(progressRecords.map((p) => [p.chapterId, p]));

  res.json(
    chapters.map((c) => ({
      ...c,
      progress: progressMap[c.id] ?? { status: 'not_started', lastFrameIndex: 0 },
    }))
  );
});

// GET /student/chapters/:id  — chapter detail + all frames (with audio URLs)
router.get('/chapters/:id', async (req: AuthRequest, res: Response) => {
  const chapter = await prisma.chapter.findUnique({
    where: { id: req.params.id, deletedAt: null },
  });
  if (!chapter) return res.status(404).json({ error: 'Chapter not found' });

  const frames = await prisma.frame.findMany({
    where: { chapterId: req.params.id },
    orderBy: { orderIndex: 'asc' },
  });

  const myProgress = await prisma.studentChapterProgress.findUnique({
    where: { studentId_chapterId: { studentId: req.user!.id, chapterId: req.params.id } },
  });

  res.json({ ...chapter, frames, myProgress });
});

export default router;
