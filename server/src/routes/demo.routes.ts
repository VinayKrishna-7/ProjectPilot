import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { demoMemoryStore, DemoIssue, DemoComment, DemoSprint } from '../services/demoMemory.store';
import { generateToken, setCookie, clearCookie } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { env } from '../config/env';

export const demoRouter = Router();

const DEMO_USER_EMAILS = [
  'demo@projectpilot.dev',
  'sarah@projectpilot.dev',
  'mike@projectpilot.dev',
];

export function isDemoSeedUser(email?: string): boolean {
  return Boolean(email && DEMO_USER_EMAILS.includes(email.trim().toLowerCase()));
}

// Helper to get current user from token
function getDemoUser(req: Request): import('../services/demoMemory.store').DemoUser | null {
  let token: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies?.access_token) {
    token = req.cookies.access_token;
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
      const found = demoMemoryStore.users.find((u) => u._id === decoded.userId);
      if (found) return found;
    } catch {}
  }
  return null;
}

function getRequiredDemoUser(req: Request): import('../services/demoMemory.store').DemoUser {
  return getDemoUser(req) || demoMemoryStore.users[0];
}

// ---------------- AUTH ----------------
demoRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  const cleanEmail = (email || '').trim().toLowerCase();

  if (!cleanEmail) {
    return sendError(res, 400, 'MISSING_EMAIL', 'Please enter your email address to sign in.');
  }

  if (!password) {
    return sendError(res, 400, 'MISSING_PASSWORD', 'Please enter your password.');
  }

  const user = demoMemoryStore.users.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    return sendError(
      res,
      404,
      'USER_NOT_FOUND',
      `No account found with email "${cleanEmail}". Please check for typos or click Sign up to create an account.`
    );
  }

  if (user.password && user.password !== password) {
    return sendError(
      res,
      401,
      'WRONG_PASSWORD',
      `Incorrect password entered for "${cleanEmail}". Please check your password and try again.`
    );
  }

  const token = generateToken(user._id, user.email);
  setCookie(res, token);
  return sendSuccess(res, { user, token }, 200, 'Login successful');
});

demoRouter.post('/auth/register', (req: Request, res: Response) => {
  const { name, email, password } = req.body || {};
  const cleanEmail = (email || '').trim().toLowerCase();

  if (!cleanEmail || !password) {
    return sendError(res, 400, 'BAD_REQUEST', 'Email and password are required');
  }

  const existing = demoMemoryStore.users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    return sendError(res, 409, 'EMAIL_IN_USE', 'Email already in use');
  }

  const newUser = {
    _id: `66500000000000000000000${demoMemoryStore.users.length + 1}`,
    name: (name || 'New User').trim(),
    email: cleanEmail,
    password: password,
    isEmailVerified: true,
    timezone: 'UTC',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  demoMemoryStore.users.push(newUser);

  // Accounts start 100% clean and clear to use user's own styles.
  // Persist to disk so credentials are permanently stored!
  demoMemoryStore.save();

  const token = generateToken(newUser._id, newUser.email);
  setCookie(res, token);
  return sendSuccess(res, { user: newUser, token }, 201, 'Registered successfully');
});

demoRouter.post('/auth/logout', (_req: Request, res: Response) => {
  clearCookie(res);
  return sendSuccess(res, null, 200, 'Logged out successfully');
});

demoRouter.get('/auth/me', (req: Request, res: Response) => {
  const user = getDemoUser(req);
  if (!user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }
  return sendSuccess(res, { user });
});

demoRouter.patch('/auth/profile', (req: Request, res: Response) => {
  const user = getDemoUser(req);
  if (!user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }
  Object.assign(user, req.body, { updatedAt: new Date().toISOString() });
  demoMemoryStore.save();
  return sendSuccess(res, { user });
});

demoRouter.patch('/auth/change-password', (req: Request, res: Response) => {
  const user = getDemoUser(req);
  if (!user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }
  const { currentPassword, newPassword } = req.body || {};
  if (user.password && user.password !== currentPassword) {
    return sendError(res, 400, 'WRONG_PASSWORD', 'Current password is incorrect');
  }
  user.password = newPassword;
  demoMemoryStore.save();
  return sendSuccess(res, null, 200, 'Password changed');
});

// ---------------- WORKSPACES ----------------
demoRouter.get('/workspaces', (req: Request, res: Response) => {
  const currentUser = getDemoUser(req);
  if (!currentUser) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  // If currentUser is one of the built-in demo users, include the built-in Acme Technologies workspace
  if (isDemoSeedUser(currentUser.email)) {
    const demoWs = demoMemoryStore.workspaces.filter(
      (ws) =>
        ws._id === '665000000000000000000010' ||
        ws.owner?._id === currentUser._id ||
        (ws.owner?.email && ws.owner.email.toLowerCase() === currentUser.email.toLowerCase())
    );
    return sendSuccess(res, { workspaces: demoWs });
  }

  // For regular / newly created users: only return workspaces owned by them
  const userWs = demoMemoryStore.workspaces.filter(
    (ws) =>
      ws.owner?._id === currentUser._id ||
      (ws.owner?.email && ws.owner.email.toLowerCase() === currentUser.email.toLowerCase())
  );
  return sendSuccess(res, { workspaces: userWs });
});

demoRouter.get('/workspaces/:workspaceId', (req: Request, res: Response) => {
  const ws = demoMemoryStore.workspaces.find((w) => w._id === req.params.workspaceId);
  if (!ws) {
    return sendError(res, 404, 'WORKSPACE_NOT_FOUND', 'Workspace not found');
  }
  return sendSuccess(res, { workspace: ws });
});

demoRouter.post('/workspaces', (req: Request, res: Response) => {
  const currentUser = getRequiredDemoUser(req);
  const name = (req.body.name || 'New Workspace').trim();
  const slug = (req.body.slug || `ws-${Date.now()}`).trim().toLowerCase();

  const newWs = {
    _id: `ws-${Date.now()}`,
    name,
    slug,
    description: req.body.description || '',
    owner: currentUser,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  demoMemoryStore.workspaces.push(newWs);
  demoMemoryStore.save();
  return sendSuccess(res, { workspace: newWs }, 201);
});

demoRouter.patch('/workspaces/:workspaceId', (req: Request, res: Response) => {
  const ws = demoMemoryStore.workspaces.find((w) => w._id === req.params.workspaceId);
  if (!ws) {
    return sendError(res, 404, 'WORKSPACE_NOT_FOUND', 'Workspace not found');
  }
  Object.assign(ws, req.body, { updatedAt: new Date().toISOString() });
  demoMemoryStore.save();
  return sendSuccess(res, { workspace: ws });
});

demoRouter.delete('/workspaces/:workspaceId', (req: Request, res: Response) => {
  const wsId = req.params.workspaceId;
  const wsIdx = demoMemoryStore.workspaces.findIndex((w) => w._id === wsId);
  if (wsIdx === -1) {
    return sendError(res, 404, 'WORKSPACE_NOT_FOUND', 'Workspace not found');
  }
  demoMemoryStore.workspaces.splice(wsIdx, 1);

  const projIds = demoMemoryStore.projects.filter((p) => p.workspace === wsId).map((p) => p._id);
  demoMemoryStore.projects = demoMemoryStore.projects.filter((p) => p.workspace !== wsId);
  demoMemoryStore.issues = demoMemoryStore.issues.filter((i) => !projIds.includes(i.project));
  demoMemoryStore.sprints = demoMemoryStore.sprints.filter((s) => !projIds.includes(s.project));
  demoMemoryStore.columns = demoMemoryStore.columns.filter((c) => !projIds.includes(c.board));
  demoMemoryStore.labels = demoMemoryStore.labels.filter((l) => !projIds.includes(l.project));

  demoMemoryStore.save();
  return sendSuccess(res, null, 200, 'Workspace deleted');
});

demoRouter.get('/workspaces/:workspaceId/projects', (req: Request, res: Response) => {
  const projects = demoMemoryStore.projects.filter((p) => p.workspace === req.params.workspaceId);
  return sendSuccess(res, { projects });
});

demoRouter.post('/workspaces/:workspaceId/projects', (req: Request, res: Response) => {
  const currentUser = getRequiredDemoUser(req);
  const projectId = `proj-${Date.now()}`;
  const key = (req.body.key || 'NP').trim().toUpperCase();
  const name = (req.body.name || 'New Project').trim();

  const newProj = {
    _id: projectId,
    workspace: req.params.workspaceId,
    name,
    key,
    description: req.body.description || '',
    lead: currentUser,
    status: 'active' as const,
    lastIssueNumber: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  demoMemoryStore.projects.push(newProj);

  // Initialize standard Kanban board columns for this project
  const defaultCols = [
    { _id: `col-${projectId}-1`, board: projectId, name: 'To Do', status: 'todo' as const, color: '#6B7280', position: 0 },
    { _id: `col-${projectId}-2`, board: projectId, name: 'In Progress', status: 'in_progress' as const, color: '#3B82F6', position: 1 },
    { _id: `col-${projectId}-3`, board: projectId, name: 'In Review', status: 'review' as const, color: '#F59E0B', position: 2 },
    { _id: `col-${projectId}-4`, board: projectId, name: 'Done', status: 'done' as const, color: '#10B981', position: 3 },
  ];
  demoMemoryStore.columns.push(...defaultCols);

  demoMemoryStore.save();
  return sendSuccess(res, { project: newProj }, 201);
});

demoRouter.get('/workspaces/:workspaceId/members', (req: Request, res: Response) => {
  const ws = demoMemoryStore.workspaces.find((w) => w._id === req.params.workspaceId);
  if (!ws) {
    return sendSuccess(res, { members: [] });
  }

  // Seed demo workspace: Alex Johnson (owner), Sarah Connor (admin), Mike Chen (member)
  if (ws._id === '665000000000000000000010') {
    const members = demoMemoryStore.users.slice(0, 3).map((u, i) => ({
      _id: `mem-${i}`,
      workspace: ws._id,
      user: u,
      role: i === 0 ? 'owner' : i === 1 ? 'admin' : 'member',
      joinedAt: new Date().toISOString(),
    }));
    return sendSuccess(res, { members });
  }

  const members = [
    {
      _id: `mem-owner-${ws._id}`,
      workspace: ws._id,
      user: ws.owner,
      role: 'owner',
      joinedAt: ws.createdAt,
    },
  ];
  return sendSuccess(res, { members });
});

demoRouter.post('/workspaces/:workspaceId/members', (req: Request, res: Response) => {
  const newMember = {
    _id: `mem-${Date.now()}`,
    workspace: req.params.workspaceId,
    user: {
      _id: `u-${Date.now()}`,
      name: req.body.email.split('@')[0],
      email: req.body.email,
      isEmailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    role: req.body.role || 'member',
    joinedAt: new Date().toISOString(),
  };
  return sendSuccess(res, { member: newMember }, 201);
});

// ---------------- PROJECTS ----------------
demoRouter.get('/projects/:projectId', (req: Request, res: Response) => {
  const proj = demoMemoryStore.projects.find((p) => p._id === req.params.projectId);
  if (!proj) {
    return sendError(res, 404, 'PROJECT_NOT_FOUND', 'Project not found');
  }
  return sendSuccess(res, { project: proj });
});

demoRouter.patch('/projects/:projectId', (req: Request, res: Response) => {
  const proj = demoMemoryStore.projects.find((p) => p._id === req.params.projectId);
  if (!proj) {
    return sendError(res, 404, 'PROJECT_NOT_FOUND', 'Project not found');
  }
  Object.assign(proj, req.body, { updatedAt: new Date().toISOString() });
  demoMemoryStore.save();
  return sendSuccess(res, { project: proj });
});

demoRouter.delete('/projects/:projectId', (req: Request, res: Response) => {
  const projectId = req.params.projectId;
  const pIdx = demoMemoryStore.projects.findIndex((p) => p._id === projectId);
  if (pIdx === -1) {
    return sendError(res, 404, 'PROJECT_NOT_FOUND', 'Project not found');
  }
  demoMemoryStore.projects.splice(pIdx, 1);
  demoMemoryStore.columns = demoMemoryStore.columns.filter((c) => c.board !== projectId);
  demoMemoryStore.issues = demoMemoryStore.issues.filter((i) => i.project !== projectId);
  demoMemoryStore.sprints = demoMemoryStore.sprints.filter((s) => s.project !== projectId);
  demoMemoryStore.labels = demoMemoryStore.labels.filter((l) => l.project !== projectId);
  demoMemoryStore.save();
  return sendSuccess(res, null, 200, 'Project deleted');
});

demoRouter.get('/projects/:projectId/members', (req: Request, res: Response) => {
  const projectId = req.params.projectId;
  const proj = demoMemoryStore.projects.find((p) => p._id === projectId);
  if (!proj) {
    return sendSuccess(res, { members: [] });
  }

  if (projectId === '665000000000000000000020' || projectId === demoMemoryStore.projects[0]?._id) {
    const members = demoMemoryStore.users.slice(0, 3).map((u, i) => ({
      _id: `p-mem-${i}`,
      project: projectId,
      user: u,
      role: i === 0 ? 'admin' : 'member',
      joinedAt: new Date().toISOString(),
    }));
    return sendSuccess(res, { members });
  }

  const members = [
    {
      _id: `p-mem-${projectId}`,
      project: projectId,
      user: proj.lead,
      role: 'admin',
      joinedAt: proj.createdAt,
    },
  ];
  return sendSuccess(res, { members });
});

demoRouter.post('/projects/:projectId/members', (req: Request, res: Response) => {
  return sendSuccess(res, { message: 'Member added' }, 201);
});

demoRouter.get('/projects/:projectId/labels', (req: Request, res: Response) => {
  const labels = demoMemoryStore.labels.filter((l) => l.project === req.params.projectId);
  return sendSuccess(res, { labels });
});

demoRouter.post('/projects/:projectId/labels', (req: Request, res: Response) => {
  const newLabel = {
    _id: `lbl-${Date.now()}`,
    project: req.params.projectId,
    name: req.body.name,
    color: req.body.color || '#3B82F6',
  };
  demoMemoryStore.labels.push(newLabel);
  demoMemoryStore.save();
  return sendSuccess(res, { label: newLabel }, 201);
});

demoRouter.get('/projects/:projectId/board', (req: Request, res: Response) => {
  const projectId = req.params.projectId;
  const project = demoMemoryStore.projects.find((p) => p._id === projectId);
  if (!project) {
    return sendError(res, 404, 'PROJECT_NOT_FOUND', 'Project not found');
  }

  let columns = demoMemoryStore.columns.filter((col) => col.board === projectId);
  if (columns.length === 0 && (projectId === '665000000000000000000020' || projectId === demoMemoryStore.projects[0]?._id)) {
    columns = demoMemoryStore.columns.filter((col) => col.board === '665000000000000000000030' || !col.board);
  }

  if (columns.length === 0) {
    columns = [
      { _id: `col-${projectId}-1`, board: projectId, name: 'To Do', status: 'todo', color: '#6B7280', position: 0 },
      { _id: `col-${projectId}-2`, board: projectId, name: 'In Progress', status: 'in_progress', color: '#3B82F6', position: 1 },
      { _id: `col-${projectId}-3`, board: projectId, name: 'In Review', status: 'review', color: '#F59E0B', position: 2 },
      { _id: `col-${projectId}-4`, board: projectId, name: 'Done', status: 'done', color: '#10B981', position: 3 },
    ];
    demoMemoryStore.columns.push(...columns);
    demoMemoryStore.save();
  }

  const columnsWithIssues = columns.map((col) => ({
    ...col,
    issues: demoMemoryStore.issues.filter(
      (iss) => iss.project === projectId && (iss.boardColumn === col._id || (!iss.boardColumn && iss.status === col.status))
    ),
  }));

  const uncolumnedIssues = demoMemoryStore.issues.filter(
    (iss) => iss.project === projectId && !iss.boardColumn && !columns.some((c) => c.status === iss.status)
  );

  return sendSuccess(res, {
    board: {
      _id: `board-${projectId}`,
      project: projectId,
      name: `${project.name} Board`,
    },
    columns: columnsWithIssues,
    uncolumnedIssues,
  });
});

demoRouter.get('/projects/:projectId/sprints/backlog', (req: Request, res: Response) => {
  const projectId = req.params.projectId;
  const issues = demoMemoryStore.issues.filter((i) => i.project === projectId && !i.sprint);
  return sendSuccess(res, { issues });
});

demoRouter.get('/projects/:projectId/sprints', (req: Request, res: Response) => {
  const projectId = req.params.projectId;
  const sprints = demoMemoryStore.sprints.filter((s) => s.project === projectId);
  return sendSuccess(res, { sprints });
});

demoRouter.post('/projects/:projectId/sprints', (req: Request, res: Response) => {
  const projectId = req.params.projectId;
  const projectSprints = demoMemoryStore.sprints.filter((s) => s.project === projectId);
  const newSprint: DemoSprint = {
    _id: `sprint-${Date.now()}`,
    project: projectId,
    name: req.body.name || `Sprint ${projectSprints.length + 1}`,
    goal: req.body.goal || '',
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    status: 'planned',
  };
  demoMemoryStore.sprints.push(newSprint);
  demoMemoryStore.save();
  return sendSuccess(res, { sprint: newSprint }, 201);
});

demoRouter.post('/projects/:projectId/sprints/:sprintId/start', (req: Request, res: Response) => {
  const sprint = demoMemoryStore.sprints.find((s) => s._id === req.params.sprintId);
  if (sprint) {
    sprint.status = 'active';
    demoMemoryStore.save();
  }
  return sendSuccess(res, { sprint });
});

demoRouter.patch('/projects/:projectId/sprints/:sprintId', (req: Request, res: Response) => {
  const sprint = demoMemoryStore.sprints.find((s) => s._id === req.params.sprintId);
  if (sprint) {
    Object.assign(sprint, req.body);
    demoMemoryStore.save();
  }
  return sendSuccess(res, { sprint });
});

demoRouter.post('/projects/:projectId/sprints/:sprintId/complete', (req: Request, res: Response) => {
  const sprint = demoMemoryStore.sprints.find((s) => s._id === req.params.sprintId);
  if (sprint) {
    sprint.status = 'completed';
  }
  const { targetSprintId, incompleteIssueAction } = req.body || {};
  demoMemoryStore.issues.forEach((iss) => {
    if (iss.sprint === req.params.sprintId && iss.status !== 'done') {
      iss.sprint = incompleteIssueAction === 'next_sprint' ? targetSprintId : undefined;
    }
  });
  demoMemoryStore.save();
  return sendSuccess(res, { sprint, movedIssues: 0 });
});

demoRouter.delete('/projects/:projectId/sprints/:sprintId', (req: Request, res: Response) => {
  const idx = demoMemoryStore.sprints.findIndex((s) => s._id === req.params.sprintId);
  if (idx !== -1) {
    demoMemoryStore.sprints.splice(idx, 1);
    demoMemoryStore.save();
  }
  return sendSuccess(res, null);
});

// ---------------- ISSUES ----------------
demoRouter.get('/projects/:projectId/issues', (req: Request, res: Response) => {
  const projectId = req.params.projectId;
  let issues = demoMemoryStore.issues.filter((i) => i.project === projectId);
  const { sprint, status, priority, type, search } = req.query as Record<string, string>;

  if (sprint === 'backlog') {
    issues = issues.filter((i) => !i.sprint);
  } else if (sprint) {
    issues = issues.filter((i) => i.sprint === sprint);
  }

  if (status) {
    issues = issues.filter((i) => i.status === status);
  }
  if (priority) {
    issues = issues.filter((i) => i.priority === priority);
  }
  if (type) {
    issues = issues.filter((i) => i.type === type);
  }
  if (search) {
    const q = search.toLowerCase();
    issues = issues.filter(
      (i) => i.title.toLowerCase().includes(q) || i.key.toLowerCase().includes(q)
    );
  }

  return sendSuccess(res, {
    issues,
    total: issues.length,
    page: 1,
    totalPages: 1,
  });
});

demoRouter.post('/projects/:projectId/issues', (req: Request, res: Response) => {
  const currentUser = getRequiredDemoUser(req);
  const projectId = req.params.projectId;
  const project = demoMemoryStore.projects.find((p) => p._id === projectId);
  const nextNum = project ? ++project.lastIssueNumber : (demoMemoryStore.issues.filter((i) => i.project === projectId).length + 1);
  const prefix = project?.key || 'PP';
  const key = `${prefix}-${nextNum}`;

  const projColumns = demoMemoryStore.columns.filter((c) => c.board === projectId);
  const column = projColumns.find((c) => c.status === (req.body.status || 'todo')) || projColumns[0] || demoMemoryStore.columns[0];

  const newIssue: DemoIssue = {
    _id: `issue-${Date.now()}`,
    project: projectId,
    key,
    title: req.body.title || 'Untitled Issue',
    description: req.body.description || '',
    type: req.body.type || 'task',
    status: req.body.status || 'todo',
    priority: req.body.priority || 'medium',
    reporter: currentUser,
    assignee: req.body.assignee ? demoMemoryStore.users.find((u) => u._id === req.body.assignee) : undefined,
    labels: [],
    sprint: req.body.sprint || undefined,
    boardColumn: column?._id || `col-${projectId}-1`,
    position: (demoMemoryStore.issues.filter((i) => i.project === projectId).length + 1) * 1000,
    storyPoints: req.body.storyPoints,
    dueDate: req.body.dueDate,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  demoMemoryStore.issues.unshift(newIssue);
  demoMemoryStore.save();
  return sendSuccess(res, { issue: newIssue }, 201);
});

demoRouter.get('/issues/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  const issue = demoMemoryStore.issues.find((i) => i._id === id || i.key === id);
  if (!issue) {
    return sendError(res, 404, 'ISSUE_NOT_FOUND', 'Issue not found');
  }
  return sendSuccess(res, { issue });
});

demoRouter.patch('/issues/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  const issue = demoMemoryStore.issues.find((i) => i._id === id || i.key === id);
  if (!issue) {
    return sendError(res, 404, 'ISSUE_NOT_FOUND', 'Issue not found');
  }

  if (req.body.version !== undefined && issue.version !== undefined && req.body.version !== issue.version) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT',
        message: 'This issue was modified by another user. Please reload the latest changes.',
        details: { currentVersion: issue.version, clientVersion: req.body.version, currentIssue: issue },
      },
    });
  }
  issue.version = (issue.version || 1) + 1;

  if (req.body.status && req.body.status !== issue.status) {
    const col = demoMemoryStore.columns.find((c) => c.status === req.body.status);
    if (col) issue.boardColumn = col._id;
  }

  if (req.body.assignee !== undefined) {
    issue.assignee = demoMemoryStore.users.find((u) => u._id === req.body.assignee);
    delete req.body.assignee;
  }

  Object.assign(issue, req.body, { updatedAt: new Date().toISOString() });
  demoMemoryStore.save();
  return sendSuccess(res, { issue });
});

demoRouter.patch('/issues/:id/move', (req: Request, res: Response) => {
  const id = req.params.id;
  const issue = demoMemoryStore.issues.find((i) => i._id === id || i.key === id);
  if (!issue) {
    return sendError(res, 404, 'ISSUE_NOT_FOUND', 'Issue not found');
  }

  if (req.body.version !== undefined && issue.version !== undefined && req.body.version !== issue.version) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT',
        message: 'This issue was modified by another user. Please reload the latest changes.',
        details: { currentVersion: issue.version, clientVersion: req.body.version, currentIssue: issue },
      },
    });
  }
  issue.version = (issue.version || 1) + 1;

  const { targetColumnId, newPosition, status } = req.body;
  if (targetColumnId) issue.boardColumn = targetColumnId;
  if (status) issue.status = status;
  if (newPosition !== undefined) issue.position = newPosition;
  issue.updatedAt = new Date().toISOString();
  demoMemoryStore.save();

  return sendSuccess(res, { issue });
});

demoRouter.delete('/issues/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  const idx = demoMemoryStore.issues.findIndex((i) => i._id === id || i.key === id);
  if (idx !== -1) {
    demoMemoryStore.issues.splice(idx, 1);
    demoMemoryStore.save();
  }
  return sendSuccess(res, null, 200, 'Issue deleted');
});

// ---------------- COMMENTS ----------------
demoRouter.get('/issues/:issueId/comments', (req: Request, res: Response) => {
  const comments = demoMemoryStore.comments.filter(
    (c) => c.issue === req.params.issueId || c.issue === '665000000000000000000103'
  );
  return sendSuccess(res, { comments });
});

demoRouter.post('/issues/:issueId/comments', (req: Request, res: Response) => {
  const currentUser = getRequiredDemoUser(req);
  const newComment: DemoComment = {
    _id: `comment-${Date.now()}`,
    issue: req.params.issueId,
    author: currentUser,
    content: req.body.content || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  demoMemoryStore.comments.push(newComment);
  demoMemoryStore.save();
  return sendSuccess(res, { comment: newComment }, 201);
});

demoRouter.patch('/comments/:commentId', (req: Request, res: Response) => {
  const comment = demoMemoryStore.comments.find((c) => c._id === req.params.commentId);
  if (comment) {
    comment.content = req.body.content || comment.content;
    comment.updatedAt = new Date().toISOString();
    demoMemoryStore.save();
  }
  return sendSuccess(res, { comment });
});

demoRouter.delete('/comments/:commentId', (req: Request, res: Response) => {
  const idx = demoMemoryStore.comments.findIndex((c) => c._id === req.params.commentId);
  if (idx !== -1) {
    demoMemoryStore.comments.splice(idx, 1);
    demoMemoryStore.save();
  }
  return sendSuccess(res, null);
});

demoRouter.delete('/issues/:issueId/comments/:commentId', (req: Request, res: Response) => {
  const idx = demoMemoryStore.comments.findIndex((c) => c._id === req.params.commentId);
  if (idx !== -1) {
    demoMemoryStore.comments.splice(idx, 1);
    demoMemoryStore.save();
  }
  return sendSuccess(res, null);
});

// ---------------- ATTACHMENTS & ACTIVITIES ----------------
demoRouter.get('/issues/:issueId/attachments', (_req: Request, res: Response) => {
  return sendSuccess(res, { attachments: [] });
});

demoRouter.get('/issues/:issueId/activities', (_req: Request, res: Response) => {
  const u1 = demoMemoryStore.users[0];
  return sendSuccess(res, {
    activities: [
      {
        _id: 'act-1',
        actor: u1,
        type: 'issue_created',
        metadata: { key: 'TF-3' },
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        _id: 'act-2',
        actor: u1,
        type: 'status_changed',
        metadata: { from: 'todo', to: 'in_progress' },
        createdAt: new Date(Date.now() - 1800000).toISOString(),
      },
    ],
  });
});

// ---------------- NOTIFICATIONS ----------------
demoRouter.get('/notifications', (req: Request, res: Response) => {
  const currentUser = getDemoUser(req);
  if (!currentUser) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  let notifs: import('../services/demoMemory.store').DemoNotification[] = [];
  if (isDemoSeedUser(currentUser.email)) {
    notifs = demoMemoryStore.notifications;
  } else {
    notifs = demoMemoryStore.notifications.filter(
      (n) => n.recipient === currentUser._id || (currentUser.email && n.recipient === currentUser.email)
    );
  }

  const unreadCount = notifs.filter((n) => !n.isRead).length;
  return sendSuccess(res, {
    notifications: notifs,
    unreadCount,
    total: notifs.length,
  });
});

demoRouter.patch('/notifications/:id/read', (req: Request, res: Response) => {
  const notif = demoMemoryStore.notifications.find((n) => n._id === req.params.id);
  if (notif) notif.isRead = true;
  return sendSuccess(res, { notification: notif });
});

demoRouter.post('/notifications/read-all', (_req: Request, res: Response) => {
  demoMemoryStore.notifications.forEach((n) => (n.isRead = true));
  return sendSuccess(res, null);
});

demoRouter.patch('/notifications/read-all', (_req: Request, res: Response) => {
  demoMemoryStore.notifications.forEach((n) => (n.isRead = true));
  return sendSuccess(res, null);
});

// ---------------- STATS / ANALYTICS ----------------
demoRouter.get('/projects/:projectId/stats', (req: Request, res: Response) => {
  const projectId = req.params.projectId;
  const issues = demoMemoryStore.issues.filter((i) => i.project === projectId);
  const total = issues.length;
  const done = issues.filter((i) => i.status === 'done').length;
  const inProgress = issues.filter((i) => i.status === 'in_progress').length;
  const review = issues.filter((i) => i.status === 'review').length;
  const todo = issues.filter((i) => i.status === 'todo').length;

  const priorityCounts: Record<string, number> = { lowest: 0, low: 0, medium: 0, high: 0, highest: 0 };
  const typeCounts: Record<string, number> = { task: 0, bug: 0, story: 0, epic: 0 };

  issues.forEach((iss) => {
    if (priorityCounts[iss.priority] !== undefined) priorityCounts[iss.priority]++;
    if (typeCounts[iss.type] !== undefined) typeCounts[iss.type]++;
  });

  const byStatus = [
    { _id: 'todo', count: todo },
    { _id: 'in_progress', count: inProgress },
    { _id: 'review', count: review },
    { _id: 'done', count: done },
  ];

  const byPriority = [
    { _id: 'lowest', count: priorityCounts.lowest },
    { _id: 'low', count: priorityCounts.low },
    { _id: 'medium', count: priorityCounts.medium },
    { _id: 'high', count: priorityCounts.high },
    { _id: 'highest', count: priorityCounts.highest },
  ];

  const byType = [
    { _id: 'task', count: typeCounts.task },
    { _id: 'bug', count: typeCounts.bug },
    { _id: 'story', count: typeCounts.story },
    { _id: 'epic', count: typeCounts.epic },
  ];

  const completedOverTime = [
    { _id: 'Day 1', count: Math.min(1, done) },
    { _id: 'Day 3', count: Math.min(2, done) },
    { _id: 'Day 7', count: Math.min(4, done) },
    { _id: 'Day 14', count: done },
  ];

  const projectSprints = demoMemoryStore.sprints.filter((s) => s.project === projectId);
  const activeSprint = projectSprints.find((s) => s.status === 'active');
  const sprintIssues = activeSprint ? issues.filter((i) => i.sprint === activeSprint._id) : [];
  const sprintDone = sprintIssues.filter((i) => i.status === 'done').length;

  return sendSuccess(res, {
    stats: {
      total,
      open: total - done,
      done,
      overdue: 0,
      byStatus,
      byPriority,
      byType,
      sprintProgress: activeSprint
        ? {
            sprint: activeSprint,
            total: sprintIssues.length,
            done: sprintDone,
            percentage: sprintIssues.length > 0 ? Math.round((sprintDone / sprintIssues.length) * 100) : 0,
          }
        : null,
      completedOverTime,
    },
  });
});

// ---------------- SESSIONS & TOKEN REFRESH ----------------
demoRouter.post('/auth/refresh', (req: Request, res: Response) => {
  const user = getDemoUser(req);
  if (!user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Invalid or expired session');
  }
  const token = generateToken(user._id, user.email);
  setCookie(res, token);
  return sendSuccess(res, { user, token, accessToken: token, refreshToken: 'demo-refresh-token' });
});

demoRouter.get('/auth/sessions', (req: Request, res: Response) => {
  const user = getRequiredDemoUser(req);
  if (demoMemoryStore.sessions.length === 0) {
    demoMemoryStore.sessions = [
      {
        _id: 'sess-current-dev',
        user: user._id,
        userAgent: (req.headers['user-agent'] as string) || 'Chrome / Windows (Current Device)',
        ipAddress: req.ip || '127.0.0.1',
        lastActiveAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        isCurrent: true,
      },
      {
        _id: 'sess-mobile-dev',
        user: user._id,
        userAgent: 'Safari / iPhone 15 Pro',
        ipAddress: '192.168.1.104',
        lastActiveAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        isCurrent: false,
      },
    ];
  }
  return sendSuccess(res, { sessions: demoMemoryStore.sessions });
});

demoRouter.delete('/auth/sessions/:id', (req: Request, res: Response) => {
  demoMemoryStore.sessions = demoMemoryStore.sessions.filter((s) => s._id !== req.params.id);
  return sendSuccess(res, null, 200, 'Session revoked');
});

demoRouter.delete('/auth/sessions', (_req: Request, res: Response) => {
  demoMemoryStore.sessions = demoMemoryStore.sessions.filter((s) => s.isCurrent);
  return sendSuccess(res, null, 200, 'Other sessions revoked');
});

// ---------------- AUDIT LOGS ----------------
demoRouter.get('/workspaces/:workspaceId/audit-log', (req: Request, res: Response) => {
  const wsId = req.params.workspaceId;
  const user = getRequiredDemoUser(req);

  if (wsId === '665000000000000000000010' && demoMemoryStore.auditLogs.length === 0) {
    const now = Date.now();
    demoMemoryStore.auditLogs = [
      {
        _id: 'audit-1',
        workspace: wsId,
        actor: user,
        action: 'workspace_created',
        entityType: 'workspace',
        entityId: wsId,
        metadata: { name: 'Acme Technologies' },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        createdAt: new Date(now - 86400000 * 5).toISOString(),
      },
      {
        _id: 'audit-2',
        workspace: wsId,
        actor: user,
        action: 'project_created',
        entityType: 'project',
        entityId: demoMemoryStore.projects[0]._id,
        metadata: { name: demoMemoryStore.projects[0].name, key: 'PP' },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        createdAt: new Date(now - 86400000 * 4).toISOString(),
      },
      {
        _id: 'audit-3',
        workspace: wsId,
        actor: user,
        action: 'sprint_started',
        entityType: 'sprint',
        entityId: demoMemoryStore.sprints[0]._id,
        metadata: { sprintName: demoMemoryStore.sprints[0].name },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        createdAt: new Date(now - 86400000 * 2).toISOString(),
      },
    ];
  }

  const { action, page = '1', limit = '20' } = req.query as Record<string, string>;
  let logs = demoMemoryStore.auditLogs.filter((l) => l.workspace === wsId);
  if (action) {
    logs = logs.filter((l) => l.action === action);
  }

  const p = Math.max(1, parseInt(page, 10));
  const l = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const total = logs.length;

  return sendSuccess(res, {
    logs: logs.slice((p - 1) * l, p * l),
    total,
    page: p,
    totalPages: Math.ceil(total / l) || 1,
  });
});

// ---------------- JQL SEARCH ----------------
demoRouter.get('/projects/:projectId/jql/search', (req: Request, res: Response) => {
  const projectId = req.params.projectId;
  const q = ((req.query.q as string) || '').toLowerCase();
  let issues = demoMemoryStore.issues.filter((i) => i.project === projectId);

  if (q.includes('status = done') || q.includes('status=done')) {
    issues = issues.filter((i) => i.status === 'done');
  } else if (q.includes('status = in_progress') || q.includes('status=in_progress')) {
    issues = issues.filter((i) => i.status === 'in_progress');
  } else if (q.includes('status = todo') || q.includes('status=todo')) {
    issues = issues.filter((i) => i.status === 'todo');
  }

  if (q.includes('priority = high') || q.includes('priority=high')) {
    issues = issues.filter((i) => i.priority === 'high' || i.priority === 'highest');
  }

  return sendSuccess(res, {
    query: req.query.q,
    count: issues.length,
    issues,
  });
});

demoRouter.get('/projects/:projectId/jql/suggest', (req: Request, res: Response) => {
  return sendSuccess(res, {
    suggestions: [
      { value: 'status', description: 'Filter by issue status', category: 'field' },
      { value: 'priority', description: 'Filter by priority level', category: 'field' },
      { value: 'assignee', description: 'Filter by assigned member', category: 'field' },
      { value: 'ORDER BY', description: 'Order by position or date', category: 'keyword' },
    ],
  });
});

// ---------------- SAVED FILTERS ----------------
demoRouter.get('/projects/:projectId/saved-filters', (req: Request, res: Response) => {
  const filters = demoMemoryStore.savedFilters.filter((f) => f.project === req.params.projectId);
  return sendSuccess(res, { filters });
});

demoRouter.post('/projects/:projectId/saved-filters', (req: Request, res: Response) => {
  const user = getRequiredDemoUser(req);
  const filter = {
    _id: `filter-${Date.now()}`,
    project: req.params.projectId,
    user,
    name: req.body.name || 'Custom View',
    description: req.body.description || '',
    jql: req.body.jql || '',
    filterConfig: req.body.filterConfig || {},
    isShared: req.body.isShared || false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  demoMemoryStore.savedFilters.push(filter);
  return sendSuccess(res, { filter }, 201);
});

demoRouter.delete('/saved-filters/:id', (req: Request, res: Response) => {
  demoMemoryStore.savedFilters = demoMemoryStore.savedFilters.filter((f) => f._id !== req.params.id);
  return sendSuccess(res, null, 200, 'Filter deleted');
});

// ---------------- WORKSPACE INVITATIONS ----------------
demoRouter.get('/workspaces/:workspaceId/invitations', (_req: Request, res: Response) => {
  return sendSuccess(res, { invitations: demoMemoryStore.invitations });
});

demoRouter.post('/workspaces/:workspaceId/invitations', (req: Request, res: Response) => {
  const user = getRequiredDemoUser(req);
  const token = `demo-token-${Date.now()}`;
  const invite = {
    _id: `inv-${Date.now()}`,
    workspace: req.params.workspaceId,
    email: req.body.email,
    role: req.body.role || 'member',
    invitedBy: user,
    status: 'pending',
    token,
    expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
    createdAt: new Date().toISOString(),
  };
  demoMemoryStore.invitations.push(invite);
  return sendSuccess(res, { invitation: invite, token }, 201);
});

demoRouter.delete('/workspaces/:workspaceId/invitations/:id', (req: Request, res: Response) => {
  demoMemoryStore.invitations = demoMemoryStore.invitations.filter((i) => i._id !== req.params.id);
  return sendSuccess(res, null, 200, 'Invitation revoked');
});

demoRouter.get('/invitations/:token', (req: Request, res: Response) => {
  const invite = demoMemoryStore.invitations.find((i) => i.token === req.params.token) || {
    _id: 'inv-sample',
    workspace: demoMemoryStore.workspaces[0],
    email: 'newcollaborator@projectpilot.dev',
    role: 'member',
    invitedBy: demoMemoryStore.users[0],
    status: 'pending',
    expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
  };
  return sendSuccess(res, { invitation: invite });
});

demoRouter.post('/invitations/:token/accept', (_req: Request, res: Response) => {
  return sendSuccess(res, { workspace: demoMemoryStore.workspaces[0], member: { role: 'member' } });
});

