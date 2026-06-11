import { Router, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import prisma from '../../lib/prisma';
import { AuthRequest } from '../../middleware/auth';

const router = Router();

const createStudentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const grantAccessSchema = z.object({
  subjectId: z.string().min(1, 'subjectId is required'),
  expiresAt: z.string().optional(),
});

// GET /admin/students
router.get('/', async (_req: AuthRequest, res: Response) => {
  const students = await prisma.user.findMany({
    where: { role: 'student', deletedAt: null },
    select: { id: true, name: true, email: true, isActive: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(students);
});

// POST /admin/students
router.post('/', async (req: AuthRequest, res: Response) => {
  const result = createStudentSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return;
  }
  const { name, email, password } = result.data;
  const passwordHash = await bcrypt.hash(password, 10);
  const student = await prisma.user.create({
    data: { name, email, passwordHash, role: 'student' },
    select: { id: true, name: true, email: true, role: true },
  });
  res.status(201).json(student);
});

// PUT /admin/students/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const studentId = req.params.id as string;
  const { name, email, isActive } = req.body;
  const student = await prisma.user.update({
    where: { id: studentId },
    data: { name, email, isActive },
    select: { id: true, name: true, email: true, isActive: true },
  });
  res.json(student);
});

// POST /admin/students/:id/access
router.post('/:id/access', async (req: AuthRequest, res: Response) => {
  const studentId = req.params.id as string;
  const result = grantAccessSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return;
  }
  const { subjectId, expiresAt } = result.data;
  const access = await prisma.studentSubjectAccess.upsert({
    where: { studentId_subjectId: { studentId, subjectId } },
    create: {
      studentId,
      subjectId,
      grantedBy: req.user!.id,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    },
    update: {
      grantedBy: req.user!.id,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      grantedAt: new Date(),
    },
  });
  res.status(201).json(access);
});

// DELETE /admin/students/:id/access/:subjectId
router.delete('/:id/access/:subjectId', async (req: AuthRequest, res: Response) => {
  const studentId = req.params.id as string;
  const subjectId = req.params.subjectId as string;
  await prisma.studentSubjectAccess.delete({
    where: { studentId_subjectId: { studentId, subjectId } },
  });
  res.status(204).end();
});

// GET /admin/students/:id/access — list subject access records for this student
router.get('/:id/access', async (req: AuthRequest, res: Response) => {
  const studentId = req.params.id as string;
  const records = await prisma.studentSubjectAccess.findMany({
    where: { studentId },
    include: { subject: { include: { class: true } } },
    orderBy: { grantedAt: 'desc' },
  });
  res.json(records);
});

// GET /admin/students/:id/progress
router.get('/:id/progress', async (req: AuthRequest, res: Response) => {
  const studentId = req.params.id as string;
  const [progress, iqScores] = await Promise.all([
    prisma.studentChapterProgress.findMany({
      where: { studentId },
      include: { chapter: { include: { subject: true } } },
      orderBy: { startedAt: 'desc' },
    }),
    prisma.studentIqScore.findMany({
      where: { studentId },
      include: { subject: true },
    }),
  ]);
  res.json({ progress, iqScores });
});

export default router;
