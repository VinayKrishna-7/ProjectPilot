import crypto from 'crypto';
import mongoose from 'mongoose';
import { Workspace } from '../models/Workspace';
import { WorkspaceMember } from '../models/WorkspaceMember';
import { WorkspaceInvitation, IWorkspaceInvitationDocument } from '../models/WorkspaceInvitation';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';
import { mailService } from '../config/mailer';
import { env } from '../config/env';
import { auditService } from './audit.service';
import { WorkspaceRole } from '@taskflow/shared';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export class InvitationService {
  async createInvitation(
    workspaceId: string,
    inviterId: mongoose.Types.ObjectId,
    email: string,
    role: WorkspaceRole = 'member'
  ): Promise<{ invitation: IWorkspaceInvitationDocument; token: string }> {
    const normalizedEmail = email.toLowerCase().trim();

    // Check workspace
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) throw new AppError('Workspace not found', 404, 'WORKSPACE_NOT_FOUND');

    const inviter = await User.findById(inviterId);
    if (!inviter) throw new AppError('Inviter not found', 404, 'USER_NOT_FOUND');

    // Check if user is already a member
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      const isMember = await WorkspaceMember.findOne({
        workspace: workspaceId,
        user: existingUser._id,
      });
      if (isMember) throw new AppError('User is already a member of this workspace', 409, 'ALREADY_MEMBER');
    }

    // Revoke any existing pending invitations for this email in this workspace
    await WorkspaceInvitation.updateMany(
      { workspace: workspaceId, email: normalizedEmail, status: 'pending' },
      { $set: { status: 'revoked' } }
    );

    // Generate cryptographic token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await WorkspaceInvitation.create({
      workspace: workspaceId,
      email: normalizedEmail,
      role,
      tokenHash,
      invitedBy: inviterId,
      status: 'pending',
      expiresAt,
    });

    const inviteUrl = `${env.CLIENT_URL}/invitations/accept?token=${rawToken}`;
    await mailService.sendWorkspaceInvite({
      to: normalizedEmail,
      workspaceName: workspace.name,
      inviterName: inviter.name,
      role,
      inviteUrl,
    });

    // Record audit event
    await auditService.record({
      workspaceId,
      actorId: inviterId,
      action: 'member_invited',
      entityType: 'invitation',
      entityId: invitation._id.toString(),
      metadata: { email: normalizedEmail, role },
    });

    return { invitation, token: rawToken };
  }

  async getPendingInvitations(workspaceId: string): Promise<any[]> {
    return WorkspaceInvitation.find({
      workspace: workspaceId,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    })
      .populate('invitedBy', 'name email avatar')
      .sort({ createdAt: -1 });
  }

  async revokeInvitation(
    invitationId: string,
    workspaceId: string,
    actorId: mongoose.Types.ObjectId
  ): Promise<void> {
    const invitation = await WorkspaceInvitation.findOne({
      _id: invitationId,
      workspace: workspaceId,
    });
    if (!invitation) throw new AppError('Invitation not found', 404, 'INVITATION_NOT_FOUND');

    invitation.status = 'revoked';
    await invitation.save();

    await auditService.record({
      workspaceId,
      actorId,
      action: 'invitation_revoked',
      entityType: 'invitation',
      entityId: invitation._id.toString(),
      metadata: { email: invitation.email },
    });
  }

  async getInvitationDetails(rawToken: string): Promise<any> {
    const tokenHash = hashToken(rawToken);
    const invitation = await WorkspaceInvitation.findOne({
      tokenHash,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    })
      .populate('workspace', 'name slug avatar description')
      .populate('invitedBy', 'name email avatar');

    if (!invitation) {
      throw new AppError('Invalid or expired invitation link', 404, 'INVITATION_INVALID');
    }

    return invitation;
  }

  async acceptInvitation(
    rawToken: string,
    userId: mongoose.Types.ObjectId
  ): Promise<{ workspace: any; member: any }> {
    const tokenHash = hashToken(rawToken);
    const invitation = await WorkspaceInvitation.findOne({
      tokenHash,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    });

    if (!invitation) {
      throw new AppError('Invalid or expired invitation link', 400, 'INVITATION_INVALID');
    }

    const existingMember = await WorkspaceMember.findOne({
      workspace: invitation.workspace,
      user: userId,
    });

    let member = existingMember;
    if (!member) {
      member = await WorkspaceMember.create({
        workspace: invitation.workspace,
        user: userId,
        role: invitation.role,
      });
    }

    invitation.status = 'accepted';
    await invitation.save();

    await auditService.record({
      workspaceId: invitation.workspace.toString(),
      actorId: userId,
      action: 'invitation_accepted',
      entityType: 'invitation',
      entityId: invitation._id.toString(),
      metadata: { email: invitation.email, role: invitation.role },
    });

    const workspace = await Workspace.findById(invitation.workspace);
    return { workspace, member };
  }
}

export const invitationService = new InvitationService();
