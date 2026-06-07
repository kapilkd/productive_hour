import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth.store';

import LoginPage from './pages/LoginPage';
import { AdminLayout, StudentLayout } from './components/shared/Layout';

import DashboardPage from './pages/admin/DashboardPage';
import ClassesPage from './pages/admin/ClassesPage';
import ClassDetailPage from './pages/admin/ClassDetailPage';
import SubjectDetailPage from './pages/admin/SubjectDetailPage';
import ChapterDetailPage from './pages/admin/ChapterDetailPage';
import StudentsPage from './pages/admin/StudentsPage';
import StudentDetailPage from './pages/admin/StudentDetailPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';

import SubjectsPage from './pages/student/SubjectsPage';
import SubjectChaptersPage from './pages/student/SubjectChaptersPage';
import ListenPage from './pages/student/ListenPage';
import ProgressPage from './pages/student/ProgressPage';

interface GuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

function ProtectedRoute({ children, allowedRoles }: GuardProps) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="classes" element={<ClassesPage />} />
          <Route path="classes/:classId" element={<ClassDetailPage />} />
          <Route path="subjects/:subjectId" element={<SubjectDetailPage />} />
          <Route path="chapters/:chapterId" element={<ChapterDetailPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="students/:studentId" element={<StudentDetailPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
        </Route>

        {/* Student */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="subjects" replace />} />
          <Route path="subjects" element={<SubjectsPage />} />
          <Route path="subjects/:subjectId" element={<SubjectChaptersPage />} />
          <Route path="chapters/:chapterId/listen" element={<ListenPage />} />
          <Route path="progress" element={<ProgressPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
