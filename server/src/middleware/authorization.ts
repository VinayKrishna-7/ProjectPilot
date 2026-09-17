import { Request, Response, NextFunction } from 'express';
import { WorkspaceMember } from '../models/WorkspaceMember';
import { ProjectMember } from '../models/ProjectMember';
import { Project } from '../models/Project';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { WorkspaceRole, ProjectRole } from '@taskflow/shared';

export const requireWorkspaceMember = (minRole?: WorkspaceRole) =>
  asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    const workspaceId = req.params.workspaceId || req.params.id;
    const userId = req.user?._id;

    if (!userId) throw new AppError('Authentication required', 401, 'UNAUTHORIZED');

    const member = await WorkspaceMember.findOne({
      workspace: workspaceId,
      user: userId,
    });

    if (!member) throw new AppError('Access denied', 403, 'FORBIDDEN');

    const roleHierarchy: WorkspaceRole[] = ['member', 'admin', 'owner'];
    if (minRole) {
      const memberLevel = roleHierarchy.indexOf(member.role);
      const requiredLevel = roleHierarchy.indexOf(minRole);
      if (memberLevel < requiredLevel) {
        throw new AppError('Insufficient permissions', 403, 'FORBIDDEN');
      }
    }

    // Attach member info to request for downstream handlers
    (req as Request & { workspaceMember?: typeof member }).workspaceMember = member;
    next();
  });

export const requireWorkspaceAdmin = requireWorkspaceMember('admin');
export const requireWorkspaceOwner = requireWorkspaceMember('owner');

export const requireProjectMember = (minRole?: ProjectRole) =>
  asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    const projectId = req.params.projectId || req.params.id;
    const userId = req.user?._id;

    if (!userId) throw new AppError('Authentication required', 401, 'UNAUTHORIZED');

    // Check if user is an explicit project member
    const member = await ProjectMember.findOne({
      project: projectId,
      user: userId,
    });

    if (!member) {
      // Workspace owners / admins get implicit access to all projects
      const project = await Project.findById(projectId);
      if (!project) throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');

      const wsMember = await WorkspaceMember.findOne({
        workspace: project.workspace,
        user: userId,
      });

      if (!wsMember || !['owner', 'admin'].includes(wsMember.role)) {
        throw new AppError('Access denied', 403, 'FORBIDDEN');
      }

      return next();
    }

    if (minRole === 'admin' && member.role !== 'admin') {
      // Allow workspace admin override even if project role is lower
      const project = await Project.findById(projectId);
      if (project) {
        const wsMember = await WorkspaceMember.findOne({
          workspace: project.workspace,
          user: userId,
        });
        if (!wsMember || !['owner', 'admin'].includes(wsMember.role)) {
          throw new AppError('Insufficient permissions', 403, 'FORBIDDEN');
        }
      }
    }

    next();
  });

export const requireProjectAdmin = requireProjectMember('admin');
