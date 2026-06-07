import { Router, Response } from 'express';
import prisma from '../../lib/prisma';
import { AuthRequest } from '../../middleware/auth';

const router = Router();

// GET /admin/analytics/overview
// Redis cache to be added in Phase 4
router.get('/overview', async (_req: AuthRequest, res: Response) => {
  const [totalStudents, totalSubjects, iqAggregate] = await Promise.all([
    prisma.user.count({ where: { role: 'student', isActive: true, deletedAt: null } }),
    prisma.subject.count(),
    prisma.studentIqScore.aggregate({ _avg: { score: true } }),
  ]);

  res.json({
    totalStudents,
    totalSubjects,
    averageIqScore: Math.round(iqAggregate._avg.score ?? 50),
  });
});

export default router;
