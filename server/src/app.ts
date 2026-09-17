import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { env } from './config/env';
import { globalRateLimit } from './middleware/rateLimit';
import { errorHandler } from './middleware/error';
import { requestIdMiddleware } from './middleware/requestId';

// Routes
import authRoutes from './routes/auth.routes';
import workspaceRoutes from './routes/workspace.routes';
import { workspaceProjectsRouter, projectRouter } from './routes/project.routes';
import { projectIssuesRouter, issueRouter } from './routes/issue.routes';
import { boardRouter } from './routes/board.routes';
import { sprintRouter } from './routes/sprint.routes';
import { issueCommentRouter, commentRouter } from './routes/comment.routes';
import notificationRoutes from './routes/notification.routes';
import { labelRouter } from './routes/label.routes';
import { issueAttachmentRouter, attachmentRouter } from './routes/attachment.routes';
import { statsRouter } from './routes/stats.routes';
import auditRoutes from './routes/audit.routes';
import jqlRoutes from './routes/jql.routes';
import { projectSavedFilterRouter, savedFilterRouter } from './routes/savedFilter.routes';
import { workspaceInvitationsRouter, publicInvitationsRouter } from './routes/invitation.routes';
import docsRoutes from './routes/docs.routes';

import { isDbConnected } from './config/database';
import { demoRouter } from './routes/demo.routes';

const app = express();

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: env.isProduction ? undefined : false,
  })
);

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  })
);

app.use(requestIdMiddleware);
app.use(globalRateLimit);
app.use(express.json({ limit: `${env.MAX_FILE_SIZE_MB}mb` }));
app.use(express.urlencoded({ extended: true, limit: `${env.MAX_FILE_SIZE_MB}mb` }));
app.use(cookieParser());

if (env.isDevelopment) {
  app.use(morgan('dev'));
}

// Health check
app.get(['/health', '/api/health'], (_req, res) => {
  res.json({
    status: 'ok',
    mode: isDbConnected() ? 'database' : 'in-memory-demo',
    database: isDbConnected() ? 'connected' : 'standby',
    timestamp: new Date().toISOString(),
  });
});

// Production readiness & observability probe
app.get(['/readiness', '/api/readiness'], (_req, res) => {
  const mongoState = mongoose.connection.readyState;
  const isHealthy = isDbConnected() || !env.isProduction; // Standby acceptable in dev

  const memory = process.memoryUsage();
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ready' : 'not_ready',
    database: {
      connected: isDbConnected(),
      readyState: mongoState === 1 ? 'connected' : mongoState === 2 ? 'connecting' : 'disconnected',
    },
    system: {
      uptimeSeconds: Math.floor(process.uptime()),
      memoryRssMb: Math.round(memory.rss / 1024 / 1024),
      heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
    },
    timestamp: new Date().toISOString(),
  });
});

// Interactive Swagger / OpenAPI Documentation
app.use('/api/docs', docsRoutes);

// Seamless in-memory demo router fallback when MongoDB is not connected
app.use('/api', (req, res, next) => {
  if (
    env.NODE_ENV === 'test' ||
    req.path === '/health' ||
    req.path === '/readiness' ||
    req.path.startsWith('/docs')
  ) {
    return next();
  }
  if (!isDbConnected()) {
    return demoRouter(req, res, next);
  }
  next();
});

// Mount Standard Database API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/workspaces/:workspaceId/projects', workspaceProjectsRouter);
app.use('/api/workspaces/:workspaceId/audit-log', auditRoutes);
app.use('/api/workspaces/:workspaceId/invitations', workspaceInvitationsRouter);
app.use('/api/invitations', publicInvitationsRouter);

app.use('/api/projects', projectRouter);
app.use('/api/projects/:projectId/issues', projectIssuesRouter);
app.use('/api/projects/:projectId/board', boardRouter);
app.use('/api/projects/:projectId/sprints', sprintRouter);
app.use('/api/projects/:projectId/labels', labelRouter);
app.use('/api/projects/:projectId/stats', statsRouter);
app.use('/api/projects/:projectId/jql', jqlRoutes);
app.use('/api/projects/:projectId/saved-filters', projectSavedFilterRouter);

app.use('/api/issues', issueRouter);
app.use('/api/issues/:issueId/comments', issueCommentRouter);
app.use('/api/issues/:issueId/attachments', issueAttachmentRouter);

app.use('/api/comments', commentRouter);
app.use('/api/attachments', attachmentRouter);
app.use('/api/saved-filters', savedFilterRouter);
app.use('/api/notifications', notificationRoutes);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route not found' },
  });
});

app.use(errorHandler);

export default app;
