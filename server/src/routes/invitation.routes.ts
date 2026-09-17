import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireWorkspaceAdmin, requireWorkspaceMember } from '../middleware/authorization';
import { inviteRateLimit } from '../middleware/rateLimit';
import { invitationService } from '../services/invitation.service';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const workspaceInvitationsRouter = Router({ mergeParams: true });
export const publicInvitationsRouter = Router();

// Mounted at /api/workspaces/:workspaceId/invitations
workspaceInvitationsRouter.post(
  '/',
  requireAuth,
  requireWorkspaceAdmin,
  inviteRateLimit,
  asyncHandler(async (req, res) => {
    const { email, role } = req.body;
    const result = await invitationService.createInvitation(
      req.params.workspaceId,
      req.user!._id,
      email,
      role
    );
    sendSuccess(res, result, 201, 'Invitation sent successfully');
  })
);

workspaceInvitationsRouter.get(
  '/',
  requireAuth,
  requireWorkspaceMember(),
  asyncHandler(async (req, res) => {
    const invitations = await invitationService.getPendingInvitations(req.params.workspaceId);
    sendSuccess(res, { invitations });
  })
);

workspaceInvitationsRouter.delete(
  '/:id',
  requireAuth,
  requireWorkspaceAdmin,
  asyncHandler(async (req, res) => {
    await invitationService.revokeInvitation(
      req.params.id,
      req.params.workspaceId,
      req.user!._id
    );
    sendSuccess(res, null, 200, 'Invitation revoked');
  })
);

// Mounted at /api/invitations
publicInvitationsRouter.get(
  '/:token',
  asyncHandler(async (req, res) => {
    const invitation = await invitationService.getInvitationDetails(req.params.token);
    sendSuccess(res, { invitation });
  })
);

publicInvitationsRouter.post(
  '/:token/accept',
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await invitationService.acceptInvitation(req.params.token, req.user!._id);
    sendSuccess(res, result, 200, 'Invitation accepted successfully');
  })
);
