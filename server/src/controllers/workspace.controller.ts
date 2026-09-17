import { Request, Response } from 'express';
import { workspaceService } from '../services/workspace.service';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const createWorkspace = asyncHandler(async (req: Request, res: Response) => {
  const workspace = await workspaceService.createWorkspace(req.user!._id, req.body);
  sendSuccess(res, { workspace }, 201, 'Workspace created');
});

export const getWorkspaces = asyncHandler(async (req: Request, res: Response) => {
  const workspaces = await workspaceService.getWorkspacesByUser(req.user!._id);
  sendSuccess(res, { workspaces });
});

export const getWorkspace = asyncHandler(async (req: Request, res: Response) => {
  const workspace = await workspaceService.getWorkspaceById(req.params.id, req.user!._id);
  sendSuccess(res, { workspace });
});

export const updateWorkspace = asyncHandler(async (req: Request, res: Response) => {
  const workspace = await workspaceService.updateWorkspace(req.params.id, req.user!._id, req.body);
  sendSuccess(res, { workspace }, 200, 'Workspace updated');
});

export const deleteWorkspace = asyncHandler(async (req: Request, res: Response) => {
  await workspaceService.deleteWorkspace(req.params.id, req.user!._id);
  sendSuccess(res, null, 200, 'Workspace deleted');
});

export const getWorkspaceMembers = asyncHandler(async (req: Request, res: Response) => {
  const members = await workspaceService.getMembers(req.params.id);
  sendSuccess(res, { members });
});

export const inviteWorkspaceMember = asyncHandler(async (req: Request, res: Response) => {
  const member = await workspaceService.inviteMember(req.params.id, req.user!._id, req.body);
  sendSuccess(res, { member }, 201, 'Member invited');
});

export const updateWorkspaceMemberRole = asyncHandler(async (req: Request, res: Response) => {
  const member = await workspaceService.updateMemberRole(
    req.params.id,
    req.params.memberId,
    req.user!._id,
    req.body.role
  );
  sendSuccess(res, { member }, 200, 'Member role updated');
});

export const removeWorkspaceMember = asyncHandler(async (req: Request, res: Response) => {
  await workspaceService.removeMember(req.params.id, req.params.memberId, req.user!._id);
  sendSuccess(res, null, 200, 'Member removed');
});
