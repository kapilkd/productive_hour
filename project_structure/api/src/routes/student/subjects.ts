import { Router, Response } from 'express';
import prisma from '../../lib/prisma';
import { AuthRequest } from '../../middleware/auth';

const router = Router();

// GET /student/subjects  — returns only subjects the student has active access to
router.get('/', async (req: AuthRequest, res: Response) => {
  const now = new Date();
  const accesses = await prisma.studentSubjectAccess.findMany({
    where: {
      studentId: req.user!.id,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    include: { subject: { include: { class: true } } },
  });
  res.json(accesses.map((a) => a.subject));
});

// GET /student/iq/:subjectId  — IQ score for one subject
router.get('/iq/:subjectId', async (req: AuthRequest, res: Response) => {
  const iq = await prisma.studentIqScore.findUnique({
    where: {
      studentId_subjectId: { studentId: req.user!.id, subjectId: req.params.subjectId },
    },
  });
  res.json({ score: iq?.score ?? 50 });
});

export default router;
