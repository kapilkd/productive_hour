import { Router, Response } from 'express';
import prisma from '../../lib/prisma';
import { AuthRequest } from '../../middleware/auth';

const router = Router();

// GET /student/subjects/:id/chapters — chapter list with progress merged in
router.get('/subjects/:id/chapters', async (req: AuthRequest, res: Response) => {
  const subjectId = req.params.id as string;
  const chapters = await prisma.chapter.findMany({
    where: { subjectId, deletedAt: null },
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

// GET /student/chapters/:id — chapter detail + frames + student's progress
router.get('/chapters/:id', async (req: AuthRequest, res: Response) => {
  const chapterId = req.params.id as string;
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId, deletedAt: null },
  });
  if (!chapter) { res.status(404).json({ error: 'Chapter not found' }); return; }

  const [frames, myProgress] = await Promise.all([
    prisma.frame.findMany({
      where: { chapterId },
      orderBy: { orderIndex: 'asc' },
    }),
    prisma.studentChapterProgress.findUnique({
      where: { studentId_chapterId: { studentId: req.user!.id, chapterId } },
    }),
  ]);

  res.json({ ...chapter, frames, myProgress });
});

export default router;
