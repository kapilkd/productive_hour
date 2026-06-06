import { Router, Response } from 'express';
import prisma from '../../lib/prisma';
import { AuthRequest } from '../../middleware/auth';
import { enqueueTTSJob } from '../../jobs/tts.job';

const router = Router();

// GET /admin/classes
router.get('/classes', async (_req: AuthRequest, res: Response) => {
  const classes = await prisma.class.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(classes);
});

// POST /admin/classes
router.post('/classes', async (req: AuthRequest, res: Response) => {
  const { name, description } = req.body;
  const cls = await prisma.class.create({
    data: { name, description, createdBy: req.user!.id },
  });
  res.status(201).json(cls);
});

// GET /admin/classes/:id/subjects
router.get('/classes/:id/subjects', async (req: AuthRequest, res: Response) => {
  const subjects = await prisma.subject.findMany({
    where: { classId: req.params.id },
    orderBy: { createdAt: 'asc' },
  });
  res.json(subjects);
});

// POST /admin/subjects
router.post('/subjects', async (req: AuthRequest, res: Response) => {
  const { classId, name, description, questionEveryNFrames, sequentialChapters } = req.body;
  const subject = await prisma.subject.create({
    data: { classId, name, description, questionEveryNFrames, sequentialChapters, createdBy: req.user!.id },
  });
  res.status(201).json(subject);
});

// PUT /admin/subjects/:id
router.put('/subjects/:id', async (req: AuthRequest, res: Response) => {
  const subject = await prisma.subject.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(subject);
});

// GET /admin/subjects/:id/chapters
router.get('/subjects/:id/chapters', async (req: AuthRequest, res: Response) => {
  const chapters = await prisma.chapter.findMany({
    where: { subjectId: req.params.id, deletedAt: null },
    orderBy: { orderIndex: 'asc' },
  });
  res.json(chapters);
});

// POST /admin/chapters
router.post('/chapters', async (req: AuthRequest, res: Response) => {
  const { subjectId, title, description, orderIndex } = req.body;
  const chapter = await prisma.chapter.create({
    data: { subjectId, title, description, orderIndex },
  });
  res.status(201).json(chapter);
});

// PUT /admin/chapters/:id
router.put('/chapters/:id', async (req: AuthRequest, res: Response) => {
  const chapter = await prisma.chapter.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(chapter);
});

// DELETE /admin/chapters/:id  (soft delete)
router.delete('/chapters/:id', async (req: AuthRequest, res: Response) => {
  await prisma.chapter.update({
    where: { id: req.params.id },
    data: { deletedAt: new Date() },
  });
  res.status(204).end();
});

// GET /admin/chapters/:id/frames
router.get('/chapters/:id/frames', async (req: AuthRequest, res: Response) => {
  const frames = await prisma.frame.findMany({
    where: { chapterId: req.params.id },
    orderBy: { orderIndex: 'asc' },
  });
  res.json(frames);
});

// POST /admin/frames  (triggers TTS job)
router.post('/frames', async (req: AuthRequest, res: Response) => {
  const { chapterId, orderIndex, contentText, imageUrl } = req.body;
  const frame = await prisma.frame.create({
    data: { chapterId, orderIndex, contentText, imageUrl, audioStatus: 'pending' },
  });
  await enqueueTTSJob(frame.id, frame.contentText);
  res.status(201).json(frame);
});

// PUT /admin/frames/:id  (re-triggers TTS)
router.put('/frames/:id', async (req: AuthRequest, res: Response) => {
  const frame = await prisma.frame.update({
    where: { id: req.params.id },
    data: { ...req.body, audioStatus: 'pending', audioUrl: null },
  });
  await enqueueTTSJob(frame.id, frame.contentText);
  res.json(frame);
});

// DELETE /admin/frames/:id
router.delete('/frames/:id', async (req: AuthRequest, res: Response) => {
  await prisma.frame.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

// GET /admin/frames/:id/tts-status
router.get('/frames/:id/tts-status', async (req: AuthRequest, res: Response) => {
  const frame = await prisma.frame.findUnique({
    where: { id: req.params.id },
    select: { audioStatus: true, audioUrl: true, durationSeconds: true },
  });
  if (!frame) return res.status(404).json({ error: 'Frame not found' });
  res.json(frame);
});

export default router;
