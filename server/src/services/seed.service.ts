import mongoose from 'mongoose';
import { User } from '../models/User';
import { Workspace } from '../models/Workspace';
import { WorkspaceMember } from '../models/WorkspaceMember';
import { Project } from '../models/Project';
import { ProjectMember } from '../models/ProjectMember';
import { Board } from '../models/Board';
import { BoardColumn } from '../models/BoardColumn';
import { Sprint } from '../models/Sprint';
import { Label } from '../models/Label';
import { Issue } from '../models/Issue';
import { Comment } from '../models/Comment';
import { Activity } from '../models/Activity';
import { Notification } from '../models/Notification';

export async function seedDatabase(): Promise<void> {
  // Clear existing collections
  await Promise.all([
    User.deleteMany({}),
    Workspace.deleteMany({}),
    WorkspaceMember.deleteMany({}),
    Project.deleteMany({}),
    ProjectMember.deleteMany({}),
    Board.deleteMany({}),
    BoardColumn.deleteMany({}),
    Sprint.deleteMany({}),
    Label.deleteMany({}),
    Issue.deleteMany({}),
    Comment.deleteMany({}),
    Activity.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  console.log('🧹 Cleaned existing database collections');

  // 1. Create Users
  const demoUser = await User.create({
    name: 'Alex Johnson',
    email: 'demo@projectpilot.dev',
    passwordHash: 'Password123!', // hashed by pre-save
    bio: 'Lead Full-Stack Engineer & Product Architect',
    timezone: 'UTC',
    isEmailVerified: true,
  });

  const memberUser1 = await User.create({
    name: 'Sarah Connor',
    email: 'sarah@projectpilot.dev',
    passwordHash: 'Password123!',
    bio: 'Senior Backend Engineer',
    timezone: 'UTC',
    isEmailVerified: true,
  });

  const memberUser2 = await User.create({
    name: 'Mike Chen',
    email: 'mike@projectpilot.dev',
    passwordHash: 'Password123!',
    bio: 'Product Designer & Frontend Specialist',
    timezone: 'UTC',
    isEmailVerified: true,
  });

  console.log('👤 Created demo users');

  // 2. Create Workspace
  const workspace = await Workspace.create({
    name: 'Acme Technologies',
    slug: 'acme-technologies',
    description: 'Engineering and Product Workspace for Acme Inc.',
    owner: demoUser._id,
  });

  await WorkspaceMember.insertMany([
    { workspace: workspace._id, user: demoUser._id, role: 'owner' },
    { workspace: workspace._id, user: memberUser1._id, role: 'admin' },
    { workspace: workspace._id, user: memberUser2._id, role: 'member' },
  ]);

  console.log('🏢 Created workspace & members');

  // 3. Create Project
  const project = await Project.create({
    workspace: workspace._id,
    name: 'ProjectPilot Platform',
    key: 'PP',
    description: 'Next-generation Jira and Trello hybrid management tool',
    lead: demoUser._id,
    status: 'active',
    lastIssueNumber: 18,
  });

  await ProjectMember.insertMany([
    { project: project._id, user: demoUser._id, role: 'admin' },
    { project: project._id, user: memberUser1._id, role: 'member' },
    { project: project._id, user: memberUser2._id, role: 'member' },
  ]);

  console.log('📁 Created project & project members');

  // 4. Create Board & Columns
  const board = await Board.create({
    project: project._id,
    name: 'Engineering Kanban',
  });

  const [colTodo, colInProgress, colReview, colDone] = await BoardColumn.insertMany([
    { board: board._id, name: 'To Do', status: 'todo', color: '#6B7280', position: 0 },
    { board: board._id, name: 'In Progress', status: 'in_progress', color: '#3B82F6', position: 1 },
    { board: board._id, name: 'In Review', status: 'review', color: '#F59E0B', position: 2 },
    { board: board._id, name: 'Done', status: 'done', color: '#10B981', position: 3 },
  ]);

  console.log('📋 Created board and columns');

  // 5. Create Sprints
  const sprint1 = await Sprint.create({
    project: project._id,
    name: 'Sprint 1 - Core MVP',
    goal: 'Launch core authentication, workspace, and Kanban boards with drag & drop',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: 'active',
  });

  const sprint2 = await Sprint.create({
    project: project._id,
    name: 'Sprint 2 - Collaboration & Analytics',
    goal: 'Add real-time Socket.IO collaboration, notifications, and analytics dashboard',
    startDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
    status: 'planned',
  });

  console.log('⚡ Created sprints');

  // 6. Create Labels
  const [lblFrontend, lblBackend, lblBug, lblUrgent, lblAuth] = await Label.insertMany([
    { project: project._id, name: 'Frontend', color: '#3B82F6' },
    { project: project._id, name: 'Backend', color: '#10B981' },
    { project: project._id, name: 'Bug', color: '#EF4444' },
    { project: project._id, name: 'Urgent', color: '#F97316' },
    { project: project._id, name: 'Auth', color: '#8B5CF6' },
  ]);

  console.log('🏷️  Created labels');

  // 7. Create Issues
  const issuesData = [
    {
      key: 'TF-1',
      title: 'Design authentication system with HTTP-only cookies',
      description: 'Implement JWT authentication with secure cookies and CSRF protection.',
      type: 'story',
      status: 'done',
      priority: 'highest',
      reporter: demoUser._id,
      assignee: memberUser1._id,
      labels: [lblBackend._id, lblAuth._id],
      sprint: sprint1._id,
      boardColumn: colDone._id,
      position: 1000,
      storyPoints: 5,
    },
    {
      key: 'TF-2',
      title: 'Setup MongoDB schemas with Mongoose and compound indexes',
      description: 'Define models for Users, Workspaces, Projects, Issues, Sprints, and Comments.',
      type: 'task',
      status: 'done',
      priority: 'high',
      reporter: demoUser._id,
      assignee: memberUser1._id,
      labels: [lblBackend._id],
      sprint: sprint1._id,
      boardColumn: colDone._id,
      position: 2000,
      storyPoints: 3,
    },
    {
      key: 'TF-3',
      title: 'Build modern responsive Kanban board with dnd-kit',
      description: 'Support multi-container drag and drop, smooth animations, and optimistic UI updates.',
      type: 'story',
      status: 'in_progress',
      priority: 'highest',
      reporter: demoUser._id,
      assignee: demoUser._id,
      labels: [lblFrontend._id, lblUrgent._id],
      sprint: sprint1._id,
      boardColumn: colInProgress._id,
      position: 1000,
      storyPoints: 8,
    },
    {
      key: 'TF-4',
      title: 'Fix issue card flickering on drag release',
      description: 'Dnd-kit transition causes a brief jump when dropped into empty column.',
      type: 'bug',
      status: 'in_progress',
      priority: 'medium',
      reporter: memberUser2._id,
      assignee: demoUser._id,
      labels: [lblFrontend._id, lblBug._id],
      sprint: sprint1._id,
      boardColumn: colInProgress._id,
      position: 2000,
      storyPoints: 2,
    },
    {
      key: 'TF-5',
      title: 'Code review for project membership authorization middleware',
      description: 'Ensure workspace admins and owners have proper overrides across all project endpoints.',
      type: 'task',
      status: 'review',
      priority: 'high',
      reporter: memberUser1._id,
      assignee: memberUser2._id,
      labels: [lblBackend._id],
      sprint: sprint1._id,
      boardColumn: colReview._id,
      position: 1000,
      storyPoints: 3,
    },
    {
      key: 'TF-6',
      title: 'Add inline status & priority dropdowns to issue detail view',
      description: 'Allow instant edits directly from the issue modal with real-time sync.',
      type: 'story',
      status: 'todo',
      priority: 'medium',
      reporter: demoUser._id,
      assignee: memberUser2._id,
      labels: [lblFrontend._id],
      sprint: sprint1._id,
      boardColumn: colTodo._id,
      position: 1000,
      storyPoints: 5,
    },
    {
      key: 'TF-7',
      title: 'Implement atomic issue counter using MongoDB findOneAndUpdate',
      description: 'Prevent concurrent issue creation from colliding on issue numbers like TF-1, TF-2.',
      type: 'task',
      status: 'todo',
      priority: 'high',
      reporter: demoUser._id,
      assignee: memberUser1._id,
      labels: [lblBackend._id],
      sprint: sprint1._id,
      boardColumn: colTodo._id,
      position: 2000,
      storyPoints: 3,
    },
    {
      key: 'TF-8',
      title: 'Integrate Socket.IO rooms for real-time board updates',
      description: 'Broadcast issue movements to project room members instantly.',
      type: 'story',
      status: 'todo',
      priority: 'high',
      reporter: demoUser._id,
      assignee: demoUser._id,
      labels: [lblBackend._id, lblFrontend._id],
      sprint: sprint2._id,
      boardColumn: colTodo._id,
      position: 3000,
      storyPoints: 5,
    },
    {
      key: 'TF-9',
      title: 'Create project dashboard with Recharts velocity and status charts',
      description: 'Display open vs done counts, priority breakdown, and sprint burndown chart.',
      type: 'story',
      status: 'todo',
      priority: 'medium',
      reporter: demoUser._id,
      assignee: memberUser2._id,
      labels: [lblFrontend._id],
      sprint: sprint2._id,
      boardColumn: colTodo._id,
      position: 4000,
      storyPoints: 5,
    },
    {
      key: 'TF-10',
      title: 'Cloudinary file upload integration for issue attachments',
      description: 'Support preview of image attachments and secure download links for documents.',
      type: 'story',
      status: 'todo',
      priority: 'medium',
      reporter: memberUser1._id,
      assignee: memberUser1._id,
      labels: [lblBackend._id],
      sprint: sprint2._id,
      boardColumn: colTodo._id,
      position: 5000,
      storyPoints: 5,
    },
    // Backlog issues (no sprint)
    {
      key: 'TF-11',
      title: 'Implement Dark Mode with theme switcher & persistent storage',
      description: 'Support light, dark, and system color schemes using Tailwind CSS variables.',
      type: 'task',
      status: 'todo',
      priority: 'low',
      reporter: demoUser._id,
      assignee: memberUser2._id,
      labels: [lblFrontend._id],
      position: 1000,
      storyPoints: 2,
    },
    {
      key: 'TF-12',
      title: 'Command Palette (Cmd+K) quick navigator',
      description: 'Quickly search issues, switch projects, and navigate pages using keyboard.',
      type: 'story',
      status: 'todo',
      priority: 'medium',
      reporter: demoUser._id,
      labels: [lblFrontend._id],
      position: 2000,
      storyPoints: 3,
    },
    {
      key: 'TF-13',
      title: 'Export sprint reports to CSV and PDF format',
      description: 'Generate comprehensive project performance and issue resolution reports.',
      type: 'task',
      status: 'todo',
      priority: 'lowest',
      reporter: memberUser1._id,
      labels: [lblBackend._id],
      position: 3000,
      storyPoints: 5,
    },
    {
      key: 'TF-14',
      title: 'Email notifications on issue assignment and mentions',
      description: 'Trigger email alerts via SMTP / transactional provider when user is mentioned in comment.',
      type: 'story',
      status: 'todo',
      priority: 'low',
      reporter: demoUser._id,
      labels: [lblBackend._id],
      position: 4000,
      storyPoints: 5,
    },
    {
      key: 'TF-15',
      title: 'Audit logging for workspace settings and membership changes',
      description: 'Retain detailed audit trails for role elevations and project archiving.',
      type: 'task',
      status: 'todo',
      priority: 'low',
      reporter: memberUser1._id,
      labels: [lblBackend._id],
      position: 5000,
      storyPoints: 3,
    },
  ];

  const createdIssues = await Issue.insertMany(
    issuesData.map((iss) => ({
      ...iss,
      project: project._id,
    }))
  );

  console.log(`📌 Created ${createdIssues.length} issues`);

  // 8. Create Comments
  const issue3 = createdIssues.find((i) => i.key === 'TF-3');
  if (issue3) {
    await Comment.create([
      {
        issue: issue3._id,
        author: memberUser2._id,
        content: 'I verified the drag animations on mobile touch devices. Responsive scrolling works great!',
      },
      {
        issue: issue3._id,
        author: demoUser._id,
        content: 'Awesome! Optimistic updates are persisting correctly back to MongoDB now.',
      },
    ]);
  }

  // 9. Create Activity History
  if (issue3) {
    await Activity.create([
      {
        project: project._id,
        issue: issue3._id,
        actor: demoUser._id,
        type: 'issue_created',
        metadata: { key: 'TF-3', title: issue3.title },
      },
      {
        project: project._id,
        issue: issue3._id,
        actor: demoUser._id,
        type: 'status_changed',
        metadata: { from: 'todo', to: 'in_progress' },
      },
    ]);
  }

  // 10. Create Notifications
  await Notification.create([
    {
      recipient: demoUser._id,
      actor: memberUser2._id,
      type: 'issue_commented',
      message: 'Mike Chen commented on TF-3: Build modern responsive Kanban board',
      entityType: 'issue',
      entityId: issue3?._id.toString(),
      isRead: false,
    },
    {
      recipient: demoUser._id,
      actor: memberUser1._id,
      type: 'sprint_started',
      message: 'Sprint "Sprint 1 - Core MVP" is now active',
      entityType: 'sprint',
      entityId: sprint1._id.toString(),
      isRead: true,
    },
  ]);

  console.log('🔔 Created comments, activity history, and notifications');
}
