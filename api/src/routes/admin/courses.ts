import { Router, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import prisma from '../../lib/prisma';
import { AuthRequest } from '../../middleware/auth';
import { enqueueTTSJob } from '../../jobs/tts.job';
import { processPDFForChapter } from '../../services/pdf.service';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    file.mimetype === 'application/pdf' ? cb(null, true) : cb(new Error('Only PDF files are allowed'));
  },
});

const router = Router();

// ── Validation schemas ────────────────────────────────────────────────────────

const createBoardSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

const createClassSchema = z.object({
  boardId: z.string().uuid('boardId must be a valid UUID'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

const createSubjectSchema = z.object({
  classId: z.string().min(1, 'classId is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  questionEveryNFrames: z.number().int().min(1).optional(),
  sequentialChapters: z.boolean().optional(),
});

const createChapterSchema = z.object({
  subjectId: z.string().min(1, 'subjectId is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  orderIndex: z.number().int().min(0),
});

const createFrameSchema = z.object({
  chapterId: z.string().min(1, 'chapterId is required'),
  orderIndex: z.number().int().min(0),
  contentText: z.string().min(1, 'contentText is required'),
  imageUrl: z.string().url().optional(),
});

const updateFrameSchema = z.object({
  contentText: z.string().min(1).optional(),
  imageUrl: z.string().url().optional().nullable(),
  orderIndex: z.number().int().min(0).optional(),
});

// ── Boards ────────────────────────────────────────────────────────────────────

router.get('/boards', async (_req: AuthRequest, res: Response) => {
  const boards = await prisma.board.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { classes: true } } },
  });
  res.json(boards);
});

router.post('/boards', async (req: AuthRequest, res: Response) => {
  const result = createBoardSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return;
  }
  const board = await prisma.board.create({ data: result.data });
  res.status(201).json(board);
});

router.get('/boards/:id/classes', async (req: AuthRequest, res: Response) => {
  const classes = await prisma.class.findMany({
    where: { boardId: req.params.id as string },
    orderBy: { createdAt: 'asc' },
    include: { _count: { select: { subjects: true } } },
  });
  res.json(classes);
});

// ── Classes ───────────────────────────────────────────────────────────────────

router.get('/classes', async (req: AuthRequest, res: Response) => {
  const { boardId } = req.query;
  const classes = await prisma.class.findMany({
    where: boardId ? { boardId: boardId as string } : undefined,
    orderBy: { createdAt: 'desc' },
  });
  res.json(classes);
});

router.post('/classes', async (req: AuthRequest, res: Response) => {
  const result = createClassSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return;
  }
  const cls = await prisma.class.create({
    data: { ...result.data, createdBy: req.user!.id },
  });
  res.status(201).json(cls);
});

// ── Subjects ──────────────────────────────────────────────────────────────────

router.get('/classes/:id/subjects', async (req: AuthRequest, res: Response) => {
  const subjects = await prisma.subject.findMany({
    where: { classId: req.params.id as string },
    orderBy: { createdAt: 'asc' },
  });
  res.json(subjects);
});

// GET /admin/subjects — flat list across all classes (needed by StudentDetailPage subject dropdown)
router.get('/subjects', async (_req: AuthRequest, res: Response) => {
  const subjects = await prisma.subject.findMany({
    include: { class: true },
    orderBy: [{ class: { name: 'asc' } }, { name: 'asc' }],
  });
  res.json(subjects);
});

// GET /admin/subjects/:id  — needed by SubjectDetailPage
router.get('/subjects/:id', async (req: AuthRequest, res: Response) => {
  const subject = await prisma.subject.findUnique({ where: { id: req.params.id as string } });
  if (!subject) { res.status(404).json({ error: 'Subject not found' }); return; }
  res.json(subject);
});

router.post('/subjects', async (req: AuthRequest, res: Response) => {
  const result = createSubjectSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return;
  }
  const subject = await prisma.subject.create({
    data: { ...result.data, createdBy: req.user!.id },
  });
  res.status(201).json(subject);
});

router.put('/subjects/:id', async (req: AuthRequest, res: Response) => {
  const subject = await prisma.subject.update({
    where: { id: req.params.id as string },
    data: req.body,
  });
  res.json(subject);
});

// ── Chapters ──────────────────────────────────────────────────────────────────

router.get('/subjects/:id/chapters', async (req: AuthRequest, res: Response) => {
  const chapters = await prisma.chapter.findMany({
    where: { subjectId: req.params.id as string, deletedAt: null },
    orderBy: { orderIndex: 'asc' },
  });
  res.json(chapters);
});

router.post('/chapters', async (req: AuthRequest, res: Response) => {
  const result = createChapterSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return;
  }
  const chapter = await prisma.chapter.create({ data: result.data });
  res.status(201).json(chapter);
});

router.put('/chapters/:id', async (req: AuthRequest, res: Response) => {
  const chapter = await prisma.chapter.update({
    where: { id: req.params.id as string },
    data: req.body,
  });
  res.json(chapter);
});

router.delete('/chapters/:id', async (req: AuthRequest, res: Response) => {
  await prisma.chapter.update({
    where: { id: req.params.id as string },
    data: { deletedAt: new Date() },
  });
  res.status(204).end();
});

// ── PDF Upload ────────────────────────────────────────────────────────────────

router.post('/chapters/:id/upload-pdf', upload.single('pdf'), async (req: AuthRequest, res: Response) => {
  const file = (req as any).file as Express.Multer.File | undefined;
  if (!file) { res.status(400).json({ error: 'No PDF file provided' }); return; }

  const chapterId = req.params.id as string;
  const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
  if (!chapter) { res.status(404).json({ error: 'Chapter not found' }); return; }

  // Respond immediately — processing runs in background
  res.status(202).json({ message: 'PDF accepted, processing started', chapterId });

  processPDFForChapter(chapterId, file.buffer, file.originalname)
    .catch(err => console.error(`[PDF] processing failed for chapter ${chapterId}:`, err));
});

router.get('/chapters/:id/processing-status', async (req: AuthRequest, res: Response) => {
  const chapter = await prisma.chapter.findUnique({
    where: { id: req.params.id as string },
    select: {
      processingStatus: true,
      processingError: true,
      sourcePdfUrl: true,
      _count: { select: { frames: true } },
    },
  });
  if (!chapter) { res.status(404).json({ error: 'Chapter not found' }); return; }
  res.json(chapter);
});

// ── Frames ────────────────────────────────────────────────────────────────────

router.get('/chapters/:id/frames', async (req: AuthRequest, res: Response) => {
  const frames = await prisma.frame.findMany({
    where: { chapterId: req.params.id as string },
    orderBy: { orderIndex: 'asc' },
  });
  res.json(frames);
});

router.post('/frames', async (req: AuthRequest, res: Response) => {
  const result = createFrameSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return;
  }
  const frame = await prisma.frame.create({
    data: { ...result.data, audioStatus: 'pending' },
  });
  await enqueueTTSJob(frame.id, frame.contentText);
  res.status(201).json(frame);
});

router.put('/frames/:id', async (req: AuthRequest, res: Response) => {
  const result = updateFrameSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return;
  }
  const frame = await prisma.frame.update({
    where: { id: req.params.id as string },
    data: { ...result.data, audioStatus: 'pending', audioUrl: null },
  });
  await enqueueTTSJob(frame.id, frame.contentText);
  res.json(frame);
});

router.delete('/frames/:id', async (req: AuthRequest, res: Response) => {
  await prisma.frame.delete({ where: { id: req.params.id as string } });
  res.status(204).end();
});

router.get('/frames/:id/tts-status', async (req: AuthRequest, res: Response) => {
  const frame = await prisma.frame.findUnique({
    where: { id: req.params.id as string },
    select: { audioStatus: true, audioUrl: true, durationSeconds: true },
  });
  if (!frame) { res.status(404).json({ error: 'Frame not found' }); return; }
  res.json(frame);
});

export default router;
