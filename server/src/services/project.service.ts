import mongoose from 'mongoose';
import { Project, IProjectDocument } from '../models/Project';
import { ProjectMember, IProjectMemberDocument } from '../models/ProjectMember';
import { WorkspaceMember } from '../models/WorkspaceMember';
import { Board } from '../models/Board';
import { BoardColumn } from '../models/BoardColumn';
import { Issue } from '../models/Issue';
import { Sprint } from '../models/Sprint';
import { Label } from '../models/Label';
import { SavedFilter } from '../models/SavedFilter';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';
import { runInTransaction } from '../config/database';
import {
  CreateProjectInput,
  UpdateProjectInput,
  AddProjectMemberInput,
} from '../validators/project.validator';

const DEFAULT_COLUMNS = [
  { name: 'To Do', status: 'todo' as const, color: '#6B7280', position: 0 },
  { name: 'In Progress', status: 'in_progress' as const, color: '#3B82F6', position: 1 },
  { name: 'In Review', status: 'review' as const, color: '#F59E0B', position: 2 },
  { name: 'Done', status: 'done' as const, color: '#10B981', position: 3 },
];

export class ProjectService {
  async createProject(
    workspaceId: string,
    creatorId: mongoose.Types.ObjectId,
    input: CreateProjectInput
  ): Promise<IProjectDocument> {
    // Verify creator is workspace member
    const wsMember = await WorkspaceMember.findOne({ workspace: workspaceId, user: creatorId });
    if (!wsMember) throw new AppError('Not a workspace member', 403, 'FORBIDDEN');

    // Check key uniqueness in workspace
    const existing = await Project.findOne({ workspace: workspaceId, key: input.key });
    if (existing) throw new AppError('Project key already in use in this workspace', 409, 'KEY_TAKEN');

    return runInTransaction(async (session) => {
      const opts = session ? { session } : {};
      const project = new Project({
        ...input,
        workspace: workspaceId,
        lead: input.lead || creatorId,
      });
      await project.save(opts);

      // Add creator as project admin
      await ProjectMember.create(
        [{ project: project._id, user: creatorId, role: 'admin' }],
        opts
      );

      // Create default board
      const board = new Board({ project: project._id, name: 'Main Board' });
      await board.save(opts);

      // Create default columns
      await BoardColumn.insertMany(
        DEFAULT_COLUMNS.map((col) => ({ ...col, board: board._id })),
        opts
      );

      return project;
    });
  }

  async getProjectsByWorkspace(
    workspaceId: string,
    userId: mongoose.Types.ObjectId
  ): Promise<IProjectDocument[]> {
    // Get projects where user is a member OR user is workspace owner/admin
    const wsMember = await WorkspaceMember.findOne({ workspace: workspaceId, user: userId });
    if (!wsMember) throw new AppError('Not a workspace member', 403, 'FORBIDDEN');

    if (['owner', 'admin'].includes(wsMember.role)) {
      // Workspace admins/owners see all projects
      return Project.find({ workspace: workspaceId })
        .populate('lead', 'name email avatar')
        .sort({ createdAt: -1 });
    }

    // Regular members see projects they're in
    const memberships = await ProjectMember.find({ user: userId }).select('project');
    const projectIds = memberships.map((m) => m.project);
    return Project.find({ workspace: workspaceId, _id: { $in: projectIds } })
      .populate('lead', 'name email avatar')
      .sort({ createdAt: -1 });
  }

  async getProjectById(
    projectId: string,
    userId: mongoose.Types.ObjectId
  ): Promise<IProjectDocument> {
    const project = await Project.findById(projectId).populate('lead', 'name email avatar');
    if (!project) throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');

    // Check access
    const isMember = await ProjectMember.findOne({ project: projectId, user: userId });
    if (!isMember) {
      const wsMember = await WorkspaceMember.findOne({ workspace: project.workspace, user: userId });
      if (!wsMember || !['owner', 'admin'].includes(wsMember.role)) {
        throw new AppError('Access denied', 403, 'FORBIDDEN');
      }
    }
    return project;
  }

  async updateProject(
    projectId: string,
    userId: mongoose.Types.ObjectId,
    input: UpdateProjectInput
  ): Promise<IProjectDocument> {
    const project = await Project.findByIdAndUpdate(
      projectId,
      { $set: input },
      { new: true, runValidators: true }
    ).populate('lead', 'name email avatar');
    if (!project) throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
    return project;
  }

  async deleteProject(
    projectId: string,
    userId: mongoose.Types.ObjectId
  ): Promise<void> {
    // Only workspace owner/admin can delete
    const project = await Project.findById(projectId);
    if (!project) throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
    const wsMember = await WorkspaceMember.findOne({ workspace: project.workspace, user: userId });
    if (!wsMember || !['owner', 'admin'].includes(wsMember.role)) {
      throw new AppError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    await runInTransaction(async (session) => {
      const opts = session ? { session } : {};
      const boards = await Board.find({ project: projectId }, '_id', opts);
      const boardIds = boards.map((b) => b._id);

      await Issue.deleteMany({ project: projectId }, opts);
      await Sprint.deleteMany({ project: projectId }, opts);
      await BoardColumn.deleteMany({ board: { $in: boardIds } }, opts);
      await Board.deleteMany({ project: projectId }, opts);
      await ProjectMember.deleteMany({ project: projectId }, opts);
      await Label.deleteMany({ project: projectId }, opts);
      await SavedFilter.deleteMany({ project: projectId }, opts);
      await Project.findByIdAndDelete(projectId, opts);
    });
  }

  async getProjectMembers(projectId: string): Promise<IProjectMemberDocument[]> {
    return ProjectMember.find({ project: projectId })
      .populate('user', 'name email avatar bio')
      .sort({ joinedAt: 1 });
  }

  async addProjectMember(
    projectId: string,
    actorId: mongoose.Types.ObjectId,
    input: AddProjectMemberInput
  ): Promise<IProjectMemberDocument> {
    const user = await User.findOne({ email: input.email });
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

    const existing = await ProjectMember.findOne({ project: projectId, user: user._id });
    if (existing) throw new AppError('User is already a member', 409, 'ALREADY_MEMBER');

    const member = await ProjectMember.create({
      project: projectId,
      user: user._id,
      role: input.role,
    });
    return member.populate('user', 'name email avatar');
  }

  async updateProjectMemberRole(
    projectId: string,
    memberId: string,
    role: 'admin' | 'member'
  ): Promise<IProjectMemberDocument> {
    const member = await ProjectMember.findById(memberId);
    if (!member || member.project.toString() !== projectId) {
      throw new AppError('Member not found', 404, 'MEMBER_NOT_FOUND');
    }
    member.role = role;
    await member.save();
    return member.populate('user', 'name email avatar');
  }

  async removeProjectMember(
    projectId: string,
    memberId: string,
    actorId: mongoose.Types.ObjectId
  ): Promise<void> {
    const member = await ProjectMember.findById(memberId);
    if (!member || member.project.toString() !== projectId) {
      throw new AppError('Member not found', 404, 'MEMBER_NOT_FOUND');
    }
    // Don't allow self-removal if only admin
    await ProjectMember.findByIdAndDelete(memberId);
  }

  /**
   * Generate next issue key atomically to prevent duplicates under concurrency.
   * Uses findOneAndUpdate with $inc to atomically increment lastIssueNumber.
   */
  async generateIssueKey(projectId: string): Promise<string> {
    const project = await Project.findByIdAndUpdate(
      projectId,
      { $inc: { lastIssueNumber: 1 } },
      { new: true }
    );
    if (!project) throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
    return `${project.key}-${project.lastIssueNumber}`;
  }
}

export const projectService = new ProjectService();
