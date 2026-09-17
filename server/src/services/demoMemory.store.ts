import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(__dirname, '../../data');
const isTest = process.env.NODE_ENV === 'test';
const STORAGE_FILE = isTest
  ? path.join(DATA_DIR, 'test-storage.json')
  : path.join(DATA_DIR, 'dev-storage.json');

export interface DemoUser {
  _id: string;
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  bio?: string;
  timezone?: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DemoWorkspace {
  _id: string;
  name: string;
  slug: string;
  description: string;
  owner: DemoUser;
  createdAt: string;
  updatedAt: string;
}

export interface DemoProject {
  _id: string;
  workspace: string;
  name: string;
  key: string;
  description: string;
  lead: DemoUser;
  status: 'active' | 'archived';
  lastIssueNumber: number;
  createdAt: string;
  updatedAt: string;
}

export interface DemoColumn {
  _id: string;
  board: string;
  name: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  color: string;
  position: number;
}

export interface DemoSprint {
  _id: string;
  project: string;
  name: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
  status: 'planned' | 'active' | 'completed';
}

export interface DemoLabel {
  _id: string;
  project: string;
  name: string;
  color: string;
}

export interface DemoIssue {
  _id: string;
  project: string;
  key: string;
  title: string;
  description?: string;
  type: 'task' | 'bug' | 'story' | 'epic';
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'lowest' | 'low' | 'medium' | 'high' | 'highest';
  reporter: DemoUser;
  assignee?: DemoUser;
  labels: DemoLabel[];
  sprint?: string;
  boardColumn: string;
  position: number;
  storyPoints?: number;
  dueDate?: string;
  attachments?: any[];
  version?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DemoComment {
  _id: string;
  issue: string;
  author: DemoUser;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface DemoNotification {
  _id: string;
  recipient: string;
  actor: DemoUser;
  type: string;
  message: string;
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  createdAt: string;
}

class DemoMemoryStore {
  public users: DemoUser[] = [];
  public workspaces: DemoWorkspace[] = [];
  public projects: DemoProject[] = [];
  public columns: DemoColumn[] = [];
  public sprints: DemoSprint[] = [];
  public labels: DemoLabel[] = [];
  public issues: DemoIssue[] = [];
  public comments: DemoComment[] = [];
  public notifications: DemoNotification[] = [];
  public sessions: any[] = [];
  public auditLogs: any[] = [];
  public savedFilters: any[] = [];
  public invitations: any[] = [];

  constructor() {
    this.initStore();
  }

  public initStore() {
    const loaded = this.loadFromDisk();
    if (!loaded) {
      this.reset();
      this.save();
    }
  }

  private loadFromDisk(): boolean {
    try {
      if (fs.existsSync(STORAGE_FILE)) {
        const raw = fs.readFileSync(STORAGE_FILE, 'utf-8');
        const data = JSON.parse(raw);
        if (data && Array.isArray(data.users) && data.users.length > 0) {
          this.users = data.users;
          this.workspaces = data.workspaces || [];
          this.projects = data.projects || [];
          this.columns = data.columns || [];
          this.sprints = data.sprints || [];
          this.labels = data.labels || [];
          this.issues = data.issues || [];
          this.comments = data.comments || [];
          this.notifications = data.notifications || [];
          this.sessions = data.sessions || [];
          this.auditLogs = data.auditLogs || [];
          this.savedFilters = data.savedFilters || [];
          this.invitations = data.invitations || [];
          return true;
        }
      }
    } catch (err) {
      console.warn('⚠️ Could not load persistent storage from disk, re-initializing defaults:', err);
    }
    return false;
  }

  public save(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const data = {
        users: this.users,
        workspaces: this.workspaces,
        projects: this.projects,
        columns: this.columns,
        sprints: this.sprints,
        labels: this.labels,
        issues: this.issues,
        comments: this.comments,
        notifications: this.notifications,
        sessions: this.sessions,
        auditLogs: this.auditLogs,
        savedFilters: this.savedFilters,
        invitations: this.invitations,
      };
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.warn('⚠️ Failed to write persistent storage to disk:', err);
    }
  }

  public reset() {
    const now = new Date().toISOString();

    const u1: DemoUser = {
      _id: '665000000000000000000001',
      name: 'Alex Johnson',
      email: 'demo@projectpilot.dev',
      password: 'Password123!',
      bio: 'Lead Full-Stack Engineer & Product Architect',
      timezone: 'UTC',
      isEmailVerified: true,
      createdAt: now,
      updatedAt: now,
    };

    const u2: DemoUser = {
      _id: '665000000000000000000002',
      name: 'Sarah Connor',
      email: 'sarah@projectpilot.dev',
      password: 'Password123!',
      bio: 'Senior Backend Engineer',
      timezone: 'UTC',
      isEmailVerified: true,
      createdAt: now,
      updatedAt: now,
    };

    const u3: DemoUser = {
      _id: '665000000000000000000003',
      name: 'Mike Chen',
      email: 'mike@projectpilot.dev',
      password: 'Password123!',
      bio: 'Product Designer & Frontend Specialist',
      timezone: 'UTC',
      isEmailVerified: true,
      createdAt: now,
      updatedAt: now,
    };

    this.users = [u1, u2, u3];

    const ws: DemoWorkspace = {
      _id: '665000000000000000000010',
      name: 'Acme Technologies',
      slug: 'acme-technologies',
      description: 'Engineering and Product Workspace for Acme Inc.',
      owner: u1,
      createdAt: now,
      updatedAt: now,
    };

    this.workspaces = [ws];

    const proj: DemoProject = {
      _id: '665000000000000000000020',
      workspace: ws._id,
      name: 'ProjectPilot Platform',
      key: 'PP',
      description: 'Next-generation Jira and Trello hybrid management tool',
      lead: u1,
      status: 'active',
      lastIssueNumber: 15,
      createdAt: now,
      updatedAt: now,
    };

    this.projects = [proj];

    const cols: DemoColumn[] = [
      { _id: '665000000000000000000041', board: '665000000000000000000030', name: 'To Do', status: 'todo', color: '#6B7280', position: 0 },
      { _id: '665000000000000000000042', board: '665000000000000000000030', name: 'In Progress', status: 'in_progress', color: '#3B82F6', position: 1 },
      { _id: '665000000000000000000043', board: '665000000000000000000030', name: 'In Review', status: 'review', color: '#F59E0B', position: 2 },
      { _id: '665000000000000000000044', board: '665000000000000000000030', name: 'Done', status: 'done', color: '#10B981', position: 3 },
    ];
    this.columns = cols;

    const sp1: DemoSprint = {
      _id: '665000000000000000000051',
      project: proj._id,
      name: 'Sprint 1 - Core MVP',
      goal: 'Launch core authentication, workspace, and Kanban boards with drag & drop',
      startDate: new Date(Date.now() - 7 * 86400000).toISOString(),
      endDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      status: 'active',
    };

    const sp2: DemoSprint = {
      _id: '665000000000000000000052',
      project: proj._id,
      name: 'Sprint 2 - Collaboration & Analytics',
      goal: 'Add real-time Socket.IO collaboration, notifications, and analytics dashboard',
      startDate: new Date(Date.now() + 8 * 86400000).toISOString(),
      endDate: new Date(Date.now() + 22 * 86400000).toISOString(),
      status: 'planned',
    };
    this.sprints = [sp1, sp2];

    const lbls: DemoLabel[] = [
      { _id: '665000000000000000000061', project: proj._id, name: 'Frontend', color: '#3B82F6' },
      { _id: '665000000000000000000062', project: proj._id, name: 'Backend', color: '#10B981' },
      { _id: '665000000000000000000063', project: proj._id, name: 'Bug', color: '#EF4444' },
      { _id: '665000000000000000000064', project: proj._id, name: 'Urgent', color: '#F97316' },
      { _id: '665000000000000000000065', project: proj._id, name: 'Auth', color: '#8B5CF6' },
    ];
    this.labels = lbls;

    this.issues = [
      {
        _id: '665000000000000000000101',
        project: proj._id,
        key: 'TF-1',
        title: 'Design authentication system with HTTP-only cookies',
        description: 'Implement JWT authentication with secure cookies and CSRF protection.',
        type: 'story',
        status: 'done',
        priority: 'highest',
        reporter: u1,
        assignee: u2,
        labels: [lbls[1], lbls[4]],
        sprint: sp1._id,
        boardColumn: cols[3]._id,
        position: 1000,
        storyPoints: 5,
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: '665000000000000000000102',
        project: proj._id,
        key: 'TF-2',
        title: 'Setup MongoDB schemas with Mongoose and compound indexes',
        description: 'Define models for Users, Workspaces, Projects, Issues, Sprints, and Comments.',
        type: 'task',
        status: 'done',
        priority: 'high',
        reporter: u1,
        assignee: u2,
        labels: [lbls[1]],
        sprint: sp1._id,
        boardColumn: cols[3]._id,
        position: 2000,
        storyPoints: 3,
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: '665000000000000000000103',
        project: proj._id,
        key: 'TF-3',
        title: 'Build modern responsive Kanban board with dnd-kit',
        description: 'Support multi-container drag and drop, smooth animations, and optimistic UI updates.',
        type: 'story',
        status: 'in_progress',
        priority: 'highest',
        reporter: u1,
        assignee: u1,
        labels: [lbls[0], lbls[3]],
        sprint: sp1._id,
        boardColumn: cols[1]._id,
        position: 1000,
        storyPoints: 8,
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: '665000000000000000000104',
        project: proj._id,
        key: 'TF-4',
        title: 'Fix issue card flickering on drag release',
        description: 'Dnd-kit transition causes a brief jump when dropped into empty column.',
        type: 'bug',
        status: 'in_progress',
        priority: 'medium',
        reporter: u3,
        assignee: u1,
        labels: [lbls[0], lbls[2]],
        sprint: sp1._id,
        boardColumn: cols[1]._id,
        position: 2000,
        storyPoints: 2,
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: '665000000000000000000105',
        project: proj._id,
        key: 'TF-5',
        title: 'Code review for project membership authorization middleware',
        description: 'Ensure workspace admins and owners have proper overrides across all project endpoints.',
        type: 'task',
        status: 'review',
        priority: 'high',
        reporter: u2,
        assignee: u3,
        labels: [lbls[1]],
        sprint: sp1._id,
        boardColumn: cols[2]._id,
        position: 1000,
        storyPoints: 3,
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: '665000000000000000000106',
        project: proj._id,
        key: 'TF-6',
        title: 'Add inline status & priority dropdowns to issue detail view',
        description: 'Allow instant edits directly from the issue modal with real-time sync.',
        type: 'story',
        status: 'todo',
        priority: 'medium',
        reporter: u1,
        assignee: u3,
        labels: [lbls[0]],
        sprint: sp1._id,
        boardColumn: cols[0]._id,
        position: 1000,
        storyPoints: 5,
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: '665000000000000000000107',
        project: proj._id,
        key: 'TF-7',
        title: 'Implement atomic issue counter using MongoDB findOneAndUpdate',
        description: 'Prevent concurrent issue creation from colliding on issue numbers like TF-1, TF-2.',
        type: 'task',
        status: 'todo',
        priority: 'high',
        reporter: u1,
        assignee: u2,
        labels: [lbls[1]],
        sprint: sp1._id,
        boardColumn: cols[0]._id,
        position: 2000,
        storyPoints: 3,
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: '665000000000000000000108',
        project: proj._id,
        key: 'TF-8',
        title: 'Integrate Socket.IO rooms for real-time board updates',
        description: 'Broadcast issue movements to project room members instantly.',
        type: 'story',
        status: 'todo',
        priority: 'high',
        reporter: u1,
        assignee: u1,
        labels: [lbls[1], lbls[0]],
        sprint: sp2._id,
        boardColumn: cols[0]._id,
        position: 3000,
        storyPoints: 5,
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: '665000000000000000000109',
        project: proj._id,
        key: 'TF-9',
        title: 'Create project dashboard with Recharts velocity and status charts',
        description: 'Display open vs done counts, priority breakdown, and sprint burndown chart.',
        type: 'story',
        status: 'todo',
        priority: 'medium',
        reporter: u1,
        assignee: u3,
        labels: [lbls[0]],
        sprint: sp2._id,
        boardColumn: cols[0]._id,
        position: 4000,
        storyPoints: 5,
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: '665000000000000000000110',
        project: proj._id,
        key: 'TF-10',
        title: 'Cloudinary file upload integration for issue attachments',
        description: 'Support preview of image attachments and secure download links for documents.',
        type: 'story',
        status: 'todo',
        priority: 'medium',
        reporter: u2,
        assignee: u2,
        labels: [lbls[1]],
        sprint: sp2._id,
        boardColumn: cols[0]._id,
        position: 5000,
        storyPoints: 5,
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: '665000000000000000000111',
        project: proj._id,
        key: 'TF-11',
        title: 'Implement Dark Mode with theme switcher & persistent storage',
        description: 'Support light, dark, and system color schemes using Tailwind CSS variables.',
        type: 'task',
        status: 'todo',
        priority: 'low',
        reporter: u1,
        assignee: u3,
        labels: [lbls[0]],
        boardColumn: cols[0]._id,
        position: 1000,
        storyPoints: 2,
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: '665000000000000000000112',
        project: proj._id,
        key: 'TF-12',
        title: 'Command Palette (Cmd+K) quick navigator',
        description: 'Quickly search issues, switch projects, and navigate pages using keyboard.',
        type: 'story',
        status: 'todo',
        priority: 'medium',
        reporter: u1,
        labels: [lbls[0]],
        boardColumn: cols[0]._id,
        position: 2000,
        storyPoints: 3,
        createdAt: now,
        updatedAt: now,
      },
    ];
    this.issues.forEach((i) => { i.version = 1; });
    this.sessions = [];
    this.auditLogs = [];
    this.savedFilters = [];
    this.invitations = [];

    this.comments = [
      {
        _id: '665000000000000000000201',
        issue: '665000000000000000000103',
        author: u3,
        content: 'I verified the drag animations on mobile touch devices. Responsive scrolling works great!',
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: '665000000000000000000202',
        issue: '665000000000000000000103',
        author: u1,
        content: 'Awesome! Optimistic updates are persisting correctly back to MongoDB now.',
        createdAt: now,
        updatedAt: now,
      },
    ];

    this.notifications = [
      {
        _id: '665000000000000000000301',
        recipient: u1._id,
        actor: u3,
        type: 'issue_commented',
        message: 'Mike Chen commented on TF-3: Build modern responsive Kanban board',
        entityType: 'issue',
        entityId: '665000000000000000000103',
        isRead: false,
        createdAt: now,
      },
      {
        _id: '665000000000000000000302',
        recipient: u1._id,
        actor: u2,
        type: 'sprint_started',
        message: 'Sprint "Sprint 1 - Core MVP" is now active',
        entityType: 'sprint',
        entityId: sp1._id,
        isRead: true,
        createdAt: now,
      },
    ];
  }
}

export const demoMemoryStore = new DemoMemoryStore();
