import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth';
import adminCourseRoutes from './routes/admin/courses';
import adminStudentRoutes from './routes/admin/students';
import adminAnalyticsRoutes from './routes/admin/analytics';
import studentRoutes from './routes/student/index';

import { verifyJWT } from './middleware/auth';
import { requireRole } from './middleware/rbac';

const app = express();

app.use(cors({ origin: process.env.WEB_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// ── Public ────────────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);

// ── Admin ─────────────────────────────────────────────────────────────────────
app.use('/api/v1/admin', verifyJWT, requireRole(['admin', 'super_admin']), adminCourseRoutes);
app.use('/api/v1/admin/students', verifyJWT, requireRole(['admin', 'super_admin']), adminStudentRoutes);
app.use('/api/v1/admin/analytics', verifyJWT, requireRole(['admin', 'super_admin']), adminAnalyticsRoutes);

// ── Student (all student routes in one router to avoid shadowing) ──────────────
app.use('/api/v1/student', verifyJWT, requireRole(['student']), studentRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

export default app;
