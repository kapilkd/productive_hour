import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../../lib/prisma';
import { AuthRequest } from '../../middleware/auth';

const router = Router();

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
router.post('/', async (_req: AuthRequest, res: Response) => {
  const { name, email, password } = _req.body;
  const passwordHash = await bcrypt.hash(password, 10);
  const student = await prisma.user.create({
    data: { name, email, passwordHash, role: 'student' },
    select: { id: true, name: true, email: true, role: true },
  });
  res.status(201).json(student);
});

// PUT /admin/students/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { name, email, isActive } = req.body;
  const student = await prisma.user.update({
    where: { id: req.params.id },
    data: { name, email, isActive },
    select: { id: true, name: true, email: true, isActive: true },
  });
  res.json(student);
});

// POST /admin/students/:id/access  (grant subject access)
router.post('/:id/access', async (req: AuthRequest, res: Response) => {
  const { subjectId, expiresAt } = req.body;
  const access = await prisma.studentSubjectAccess.upsert({
    where: { studentId_subjectId: { studentId: req.params.id, subjectId } },
    create: { studentId: req.params.id, subjectId, grantedBy: req.user!.id, expiresAt },
    update: { grantedBy: req.user!.id, expiresAt, grantedAt: new Date() },
  });
  res.status(201).json(access);
});

// DELETE /admin/students/:id/access/:subjectId  (revoke access)
router.delete('/:id/access/:subjectId', async (req: AuthRequest, res: Response) => {
  await prisma.studentSubjectAccess.delete({
    where: {
      studentId_subjectId: { studentId: req.params.id, subjectId: req.params.subjectId },
    },
  });
  res.status(204).end();
});

// GET /admin/students/:id/progress
router.get('/:id/progress', async (req: AuthRequest, res: Response) => {
  const [progress, iqScores] = await Promise.all([
    prisma.studentChapterProgress.findMany({
      where: { studentId: req.params.id },
      include: { chapter: { include: { subject: true } } },
      orderBy: { startedAt: 'desc' },
    }),
    prisma.studentIqScore.findMany({
      where: { studentId: req.params.id },
      include: { subject: true },
    }),
  ]);
  res.json({ progress, iqScores });
});

export default router;
