import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { verifyJWT, AuthRequest } from '../middleware/auth';

const accessTTL = (process.env.JWT_ACCESS_TTL ?? '15m') as SignOptions['expiresIn'];
const refreshTTL = (process.env.JWT_REFRESH_TTL ?? '7d') as SignOptions['expiresIn'];

const router = Router();

// POST /api/v1/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // findUnique only accepts @unique fields — check deletedAt separately
  const user = await prisma.user.findUnique({ where: { email } });
  if (
    !user ||
    user.deletedAt !== null ||
    !user.isActive ||
    !(await bcrypt.compare(password, user.passwordHash))
  ) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const payload = { sub: user.id, role: user.role, email: user.email };

  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, { expiresIn: accessTTL });
  const refreshToken = jwt.sign({ sub: user.id }, process.env.JWT_REFRESH_SECRET!, { expiresIn: refreshTTL });

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
  const token = req.cookies?.refreshToken as string | undefined;
  if (!token) {
    res.status(401).json({ error: 'No refresh token' });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as jwt.JwtPayload;
    const accessToken = jwt.sign({ sub: payload.sub }, process.env.JWT_ACCESS_SECRET!, { expiresIn: accessTTL });
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
