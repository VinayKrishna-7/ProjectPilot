import mongoose from 'mongoose';
import { Workspace, IWorkspaceDocument } from '../models/Workspace';
import { WorkspaceMember, IWorkspaceMemberDocument } from '../models/WorkspaceMember';
import { Project } from '../models/Project';
import { ProjectMember } from '../models/ProjectMember';
import { Issue } from '../models/Issue';
import { Board } from '../models/Board';
import { BoardColumn } from '../models/BoardColumn';
import { Sprint } from '../models/Sprint';
import { AuditLog } from '../models/AuditLog';
import { WorkspaceInvitation } from '../models/WorkspaceInvitation';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';
import { runInTransaction } from '../config/database';
import { CreateWorkspaceInput, UpdateWorkspaceInput, InviteMemberInput } from '../validators/workspace.validator';

export class WorkspaceService {
  async createWorkspace(
    ownerId: mongoose.Types.ObjectId,
    input: CreateWorkspaceInput
  ): Promise<IWorkspaceDocument> {
    const existing = await Workspace.findOne({ slug: input.slug });
    if (existing) throw new AppError('Workspace slug already taken', 409, 'SLUG_TAKEN');

    return runInTransaction(async (session) => {
      const opts = session ? { session } : {};
      const workspace = new Workspace({
        ...input,
        owner: ownerId,
      });
      await workspace.save(opts);

      await WorkspaceMember.create(
        [{ workspace: workspace._id, user: ownerId, role: 'owner' }],
        opts
      );

      return workspace;
    });
  }

  async getWorkspacesByUser(userId: mongoose.Types.ObjectId): Promise<IWorkspaceDocument[]> {
    const memberships = await WorkspaceMember.find({ user: userId }).select('workspace');
    const workspaceIds = memberships.map((m) => m.workspace);
    return Workspace.find({ _id: { $in: workspaceIds } }).populate('owner', 'name email avatar');
  }

  async getWorkspaceById(
    workspaceId: string,
    userId: mongoose.Types.ObjectId
  ): Promise<IWorkspaceDocument> {
    const member = await WorkspaceMember.findOne({
      workspace: workspaceId,
      user: userId,
    });
    if (!member) throw new AppError('Access denied to workspace', 403, 'FORBIDDEN');

    const workspace = await Workspace.findById(workspaceId).populate('owner', 'name email avatar');
    if (!workspace) throw new AppError('Workspace not found', 404, 'WORKSPACE_NOT_FOUND');
    return workspace;
  }

  async updateWorkspace(
    workspaceId: string,
    userId: mongoose.Types.ObjectId,
    input: UpdateWorkspaceInput
  ): Promise<IWorkspaceDocument> {
    const member = await WorkspaceMember.findOne({ workspace: workspaceId, user: userId });
    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw new AppError('Insufficient permissions to update workspace', 403, 'FORBIDDEN');
    }

    const workspace = await Workspace.findByIdAndUpdate(
      workspaceId,
      { $set: input },
      { new: true, runValidators: true }
    ).populate('owner', 'name email avatar');
    if (!workspace) throw new AppError('Workspace not found', 404, 'WORKSPACE_NOT_FOUND');
    return workspace;
  }

  async deleteWorkspace(
    workspaceId: string,
    userId: mongoose.Types.ObjectId
  ): Promise<void> {
    const member = await WorkspaceMember.findOne({ workspace: workspaceId, user: userId });
    if (!member || member.role !== 'owner') {
      throw new AppError('Only the workspace owner can delete a workspace', 403, 'FORBIDDEN');
    }

    await runInTransaction(async (session) => {
      const opts = session ? { session } : {};
      // Find all projects in workspace
      const projects = await Project.find({ workspace: workspaceId }, '_id', opts);
      const projectIds = projects.map((p) => p._id);

      if (projectIds.length > 0) {
        const boards = await Board.find({ project: { $in: projectIds } }, '_id', opts);
        const boardIds = boards.map((b) => b._id);

        await Issue.deleteMany({ project: { $in: projectIds } }, opts);
        await Sprint.deleteMany({ project: { $in: projectIds } }, opts);
        await BoardColumn.deleteMany({ board: { $in: boardIds } }, opts);
        await Board.deleteMany({ project: { $in: projectIds } }, opts);
        await ProjectMember.deleteMany({ project: { $in: projectIds } }, opts);
        await Project.deleteMany({ workspace: workspaceId }, opts);
      }

      await WorkspaceMember.deleteMany({ workspace: workspaceId }, opts);
      await WorkspaceInvitation.deleteMany({ workspace: workspaceId }, opts);
      await AuditLog.deleteMany({ workspace: workspaceId }, opts);
      await Workspace.findByIdAndDelete(workspaceId, opts);
    });
  }

  async getMembers(workspaceId: string): Promise<IWorkspaceMemberDocument[]> {
    return WorkspaceMember.find({ workspace: workspaceId })
      .populate('user', 'name email avatar bio')
      .sort({ joinedAt: 1 });
  }

  async inviteMember(
    workspaceId: string,
    _actorId: mongoose.Types.ObjectId,
    input: InviteMemberInput
  ): Promise<IWorkspaceMemberDocument> {
    const targetUser = await User.findOne({ email: input.email });
    if (!targetUser) throw new AppError('User with this email not found', 404, 'USER_NOT_FOUND');

    const existing = await WorkspaceMember.findOne({
      workspace: workspaceId,
      user: targetUser._id,
    });
    if (existing) throw new AppError('User is already a member', 409, 'ALREADY_MEMBER');

    const member = await WorkspaceMember.create({
      workspace: workspaceId,
      user: targetUser._id,
      role: input.role,
    });

    return member.populate('user', 'name email avatar');
  }

  async updateMemberRole(
    workspaceId: string,
    memberId: string,
    actorId: mongoose.Types.ObjectId,
    role: 'admin' | 'member'
  ): Promise<IWorkspaceMemberDocument> {
    const actor = await WorkspaceMember.findOne({ workspace: workspaceId, user: actorId });
    if (!actor || !['owner', 'admin'].includes(actor.role)) {
      throw new AppError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const target = await WorkspaceMember.findById(memberId);
    if (!target || target.workspace.toString() !== workspaceId) {
      throw new AppError('Member not found', 404, 'MEMBER_NOT_FOUND');
    }
    if (target.role === 'owner') {
      throw new AppError('Cannot change owner role', 400, 'CANNOT_CHANGE_OWNER');
    }

    target.role = role;
    await target.save();
    return target.populate('user', 'name email avatar');
  }

  async removeMember(
    workspaceId: string,
    memberId: string,
    actorId: mongoose.Types.ObjectId
  ): Promise<void> {
    const actor = await WorkspaceMember.findOne({ workspace: workspaceId, user: actorId });
    if (!actor || !['owner', 'admin'].includes(actor.role)) {
      throw new AppError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const target = await WorkspaceMember.findById(memberId);
    if (!target || target.workspace.toString() !== workspaceId) {
      throw new AppError('Member not found', 404, 'MEMBER_NOT_FOUND');
    }
    if (target.role === 'owner') {
      throw new AppError('Cannot remove workspace owner', 400, 'CANNOT_REMOVE_OWNER');
    }

    await WorkspaceMember.findByIdAndDelete(memberId);
  }
}

export const workspaceService = new WorkspaceService();
