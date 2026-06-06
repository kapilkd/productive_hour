import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth';
import adminCoursesRoutes from './routes/admin/courses';
import adminStudentsRoutes from './routes/admin/students';
import adminAnalyticsRoutes from './routes/admin/analytics';
import studentSubjectsRoutes from './routes/student/subjects';
import studentChaptersRoutes from './routes/student/chapters';
import studentProgressRoutes from './routes/student/progress';

import { verifyJWT } from './middleware/auth';
import { requireRole } from './middleware/rbac';

const app = express();

app.use(cors({ origin: process.env.WEB_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// ── Public ───────────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);

// ── Admin (admin + super_admin) ───────────────────────────────────────────────
const adminGuard = [verifyJWT, requireRole(['admin', 'super_admin'])];
app.use('/api/v1/admin', ...adminGuard, adminCoursesRoutes);
app.use('/api/v1/admin/students', ...adminGuard, adminStudentsRoutes);
app.use('/api/v1/admin/analytics', ...adminGuard, adminAnalyticsRoutes);

// ── Student ───────────────────────────────────────────────────────────────────
const studentGuard = [verifyJWT, requireRole(['student'])];
app.use('/api/v1/student', ...studentGuard, studentSubjectsRoutes);
app.use('/api/v1/student', ...studentGuard, studentChaptersRoutes);
app.use('/api/v1/student', ...studentGuard, studentProgressRoutes);

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

export default app;
