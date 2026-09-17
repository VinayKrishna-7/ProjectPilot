import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { PageLoader } from '@/components/common/PageLoader';

// Auth
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));

// App
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const WorkspacePage = lazy(() => import('@/pages/WorkspacePage'));
const ProjectOverviewPage = lazy(() => import('@/pages/project/ProjectOverviewPage'));
const BoardPage = lazy(() => import('@/pages/project/BoardPage'));
const BacklogPage = lazy(() => import('@/pages/project/BacklogPage'));
const SprintsPage = lazy(() => import('@/pages/project/SprintsPage'));
const ProjectReportsPage = lazy(() => import('@/pages/project/ProjectReportsPage'));
const ProjectMembersPage = lazy(() => import('@/pages/project/ProjectMembersPage'));
const ProjectSettingsPage = lazy(() => import('@/pages/project/ProjectSettingsPage'));
const IssueDetailPage = lazy(() => import('@/pages/IssueDetailPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const SecuritySettingsPage = lazy(() => import('@/pages/SecuritySettingsPage'));
const AuditLogPage = lazy(() => import('@/pages/AuditLogPage'));
const AcceptInvitePage = lazy(() => import('@/pages/AcceptInvitePage'));

export function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public / Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
        <Route path="/invitations/accept" element={<AcceptInvitePage />} />

        {/* Protected app routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/workspaces/:workspaceId" element={<WorkspacePage />} />
            <Route path="/workspaces/:workspaceId/audit-log" element={<AuditLogPage />} />
            <Route path="/projects/:projectId" element={<Navigate to="overview" replace />} />
            <Route path="/projects/:projectId/overview" element={<ProjectOverviewPage />} />
            <Route path="/projects/:projectId/board" element={<BoardPage />} />
            <Route path="/projects/:projectId/backlog" element={<BacklogPage />} />
            <Route path="/projects/:projectId/sprints" element={<SprintsPage />} />
            <Route path="/projects/:projectId/reports" element={<ProjectReportsPage />} />
            <Route path="/projects/:projectId/members" element={<ProjectMembersPage />} />
            <Route path="/projects/:projectId/settings" element={<ProjectSettingsPage />} />
            <Route path="/issues/:issueId" element={<IssueDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/security" element={<SecuritySettingsPage />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
