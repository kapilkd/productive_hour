import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { verifyJWT, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/v1/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email, deletedAt: null } });
  if (!user || !user.isActive || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const payload = { sub: user.id, role: user.role, email: user.email };

  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: process.env.JWT_ACCESS_TTL,
  });
  const refreshToken = jwt.sign({ sub: user.id }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_TTL,
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  res.json({
    accessToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

// POST /api/v1/auth/refresh
router.post('/refresh', (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ error: 'No refresh token' });

  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as jwt.JwtPayload;
    const accessToken = jwt.sign({ sub: payload.sub }, process.env.JWT_ACCESS_SECRET!, {
      expiresIn: process.env.JWT_ACCESS_TTL,
    });
    res.json({ accessToken });
  } catch {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

// POST /api/v1/auth/logout
router.post('/logout', verifyJWT, (_req: AuthRequest, res: Response) => {
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out' });
});

export default router;
