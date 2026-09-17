import {
  IUser,
  IWorkspace,
  IWorkspaceMember,
  IProject,
  IProjectMember,
  IBoard,
  IBoardColumn,
  IIssue,
  ISprint,
  IComment,
  IActivity,
  INotification,
  ILabel,
  IAttachment,
} from '@taskflow/shared';

export type {
  IUser,
  IWorkspace,
  IWorkspaceMember,
  IProject,
  IProjectMember,
  IBoard,
  IBoardColumn,
  IIssue,
  ISprint,
  IComment,
  IActivity,
  INotification,
  ILabel,
  IAttachment,
};

export interface PaginatedIssues {
  issues: IIssue[];
  total: number;
  page: number;
  totalPages: number;
}

export interface BoardData {
  board: IBoard;
  columns: (IBoardColumn & { issues: IIssue[] })[];
  uncolumnedIssues: IIssue[];
}

export interface ProjectStats {
  total: number;
  open: number;
  done: number;
  overdue: number;
  byStatus: Array<{ _id: string; count: number }>;
  byPriority: Array<{ _id: string; count: number }>;
  byType: Array<{ _id: string; count: number }>;
  sprintProgress: {
    sprint: ISprint;
    total: number;
    done: number;
    percentage: number;
  } | null;
  completedOverTime: Array<{ _id: string; count: number }>;
}

export interface NotificationData {
  notifications: INotification[];
  unreadCount: number;
  total: number;
}
