// ─── Enums ────────────────────────────────────────────────────────────────────

export type IssueType = 'task' | 'bug' | 'story' | 'epic';
export type IssuePriority = 'lowest' | 'low' | 'medium' | 'high' | 'highest';
export type IssueStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type SprintStatus = 'planned' | 'active' | 'completed';
export type ProjectStatus = 'active' | 'archived';
export type WorkspaceRole = 'owner' | 'admin' | 'member';
export type ProjectRole = 'admin' | 'member';
export type NotificationType =
  | 'issue_assigned'
  | 'issue_mentioned'
  | 'issue_commented'
  | 'issue_status_changed'
  | 'sprint_started'
  | 'sprint_completed'
  | 'workspace_invitation'
  | 'project_invitation'
  | 'member_added'
  | 'member_removed';

export type ActivityType =
  | 'issue_created'
  | 'issue_updated'
  | 'status_changed'
  | 'priority_changed'
  | 'assignee_changed'
  | 'sprint_changed'
  | 'label_added'
  | 'label_removed'
  | 'comment_created'
  | 'comment_updated'
  | 'comment_deleted'
  | 'attachment_added'
  | 'attachment_removed'
  | 'issue_deleted';

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface IUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  timezone?: string;
  isEmailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Workspace ────────────────────────────────────────────────────────────────

export interface IWorkspace {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  owner: string | IUser;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IWorkspaceMember {
  _id: string;
  workspace: string | IWorkspace;
  user: string | IUser;
  role: WorkspaceRole;
  joinedAt: string;
}

// ─── Project ──────────────────────────────────────────────────────────────────

export interface IProject {
  _id: string;
  workspace: string | IWorkspace;
  name: string;
  key: string;
  description?: string;
  lead?: string | IUser;
  avatar?: string;
  status: ProjectStatus;
  lastIssueNumber: number;
  createdAt: string;
  updatedAt: string;
}

export interface IProjectMember {
  _id: string;
  project: string | IProject;
  user: string | IUser;
  role: ProjectRole;
  joinedAt: string;
}

// ─── Board ────────────────────────────────────────────────────────────────────

export interface IBoard {
  _id: string;
  project: string | IProject;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface IBoardColumn {
  _id: string;
  board: string | IBoard;
  name: string;
  position: number;
  color?: string;
  status: IssueStatus;
  createdAt: string;
  updatedAt: string;
}

// ─── Issue ────────────────────────────────────────────────────────────────────

export interface IIssue {
  _id: string;
  project: string | IProject;
  key: string;
  title: string;
  description?: string;
  type: IssueType;
  status: IssueStatus;
  priority: IssuePriority;
  reporter: string | IUser;
  assignee?: string | IUser;
  labels: Array<string | ILabel>;
  sprint?: string | ISprint;
  boardColumn?: string | IBoardColumn;
  position: number;
  storyPoints?: number;
  dueDate?: string;
  parentIssue?: string | IIssue;
  attachments: Array<string | IAttachment>;
  version: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Sprint ───────────────────────────────────────────────────────────────────

export interface ISprint {
  _id: string;
  project: string | IProject;
  name: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
  status: SprintStatus;
  createdAt: string;
  updatedAt: string;
}

// ─── Comment ──────────────────────────────────────────────────────────────────

export interface IComment {
  _id: string;
  issue: string | IIssue;
  author: string | IUser;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Activity ─────────────────────────────────────────────────────────────────

export interface IActivity {
  _id: string;
  workspace?: string;
  project?: string | IProject;
  issue?: string | IIssue;
  actor: string | IUser;
  type: ActivityType;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────

export interface INotification {
  _id: string;
  recipient: string | IUser;
  actor?: string | IUser;
  type: NotificationType;
  message: string;
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  createdAt: string;
}

// ─── Label ────────────────────────────────────────────────────────────────────

export interface ILabel {
  _id: string;
  project: string | IProject;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Attachment ───────────────────────────────────────────────────────────────

export interface IAttachment {
  _id: string;
  issue: string | IIssue;
  uploadedBy: string | IUser;
  fileName: string;
  url: string;
  publicId: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

// ─── Socket Events ────────────────────────────────────────────────────────────

export type SocketEvent =
  | 'issue_created'
  | 'issue_updated'
  | 'issue_deleted'
  | 'issue_moved'
  | 'comment_created'
  | 'comment_updated'
  | 'comment_deleted'
  | 'notification_created'
  | 'member_added'
  | 'member_removed'
  | 'sprint_started'
  | 'sprint_completed'
  | 'column_created'
  | 'column_updated'
  | 'column_deleted';

export interface SocketEventPayload<T = unknown> {
  event: SocketEvent;
  data: T;
  projectId?: string;
  workspaceId?: string;
}

// ─── Session Management ──────────────────────────────────────────────────────

export interface ISession {
  _id: string;
  user: string | IUser;
  userAgent: string;
  ipAddress: string;
  lastActiveAt: string;
  expiresAt: string;
  isRevoked: boolean;
  isCurrent?: boolean;
  createdAt: string;
}

// ─── Security Audit Log ──────────────────────────────────────────────────────

export type AuditAction =
  | 'user_login'
  | 'user_logout'
  | 'session_revoked'
  | 'all_sessions_revoked'
  | 'workspace_created'
  | 'workspace_updated'
  | 'workspace_deleted'
  | 'member_invited'
  | 'invitation_accepted'
  | 'invitation_revoked'
  | 'member_role_updated'
  | 'member_removed'
  | 'project_created'
  | 'project_updated'
  | 'project_deleted'
  | 'sprint_started'
  | 'sprint_completed'
  | 'issue_deleted';

export interface IAuditLog {
  _id: string;
  workspace: string;
  actor: string | IUser;
  action: AuditAction;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// ─── Saved Filters ───────────────────────────────────────────────────────────

export interface ISavedFilter {
  _id: string;
  project: string;
  user: string | IUser;
  name: string;
  description?: string;
  jql?: string;
  filterConfig?: {
    status?: string[];
    priority?: string[];
    type?: string[];
    assignee?: string[];
    search?: string;
  };
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Workspace Invitation ────────────────────────────────────────────────────

export interface IWorkspaceInvitation {
  _id: string;
  workspace: string | IWorkspace;
  email: string;
  role: WorkspaceRole;
  invitedBy: string | IUser;
  status: 'pending' | 'accepted' | 'revoked';
  expiresAt: string;
  token?: string;
  createdAt: string;
}

// ─── JQL (Issue Query Language) ──────────────────────────────────────────────

export type JqlField = 'status' | 'priority' | 'type' | 'assignee' | 'reporter' | 'sprint' | 'label' | 'key' | 'title';
export type JqlOperator = '=' | '!=' | 'in' | 'not in' | '~' | '>' | '<';

export interface JqlSuggestion {
  value: string;
  description: string;
  category: 'field' | 'operator' | 'value' | 'keyword';
}

export interface JqlParseResult {
  valid: boolean;
  ast?: unknown;
  mongoQuery?: Record<string, unknown>;
  sort?: Record<string, 1 | -1>;
  error?: string;
  position?: number;
}

