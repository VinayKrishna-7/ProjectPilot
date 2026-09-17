import { Request, Response } from 'express';
import { projectService } from '../services/project.service';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await projectService.createProject(
    req.params.workspaceId,
    req.user!._id,
    req.body
  );
  sendSuccess(res, { project }, 201, 'Project created');
});

export const getProjects = asyncHandler(async (req: Request, res: Response) => {
  const projects = await projectService.getProjectsByWorkspace(
    req.params.workspaceId,
    req.user!._id
  );
  sendSuccess(res, { projects });
});

export const getProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await projectService.getProjectById(req.params.id, req.user!._id);
  sendSuccess(res, { project });
});

export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await projectService.updateProject(req.params.id, req.user!._id, req.body);
  sendSuccess(res, { project }, 200, 'Project updated');
});

export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  await projectService.deleteProject(req.params.id, req.user!._id);
  sendSuccess(res, null, 200, 'Project deleted');
});

export const getProjectMembers = asyncHandler(async (req: Request, res: Response) => {
  const members = await projectService.getProjectMembers(req.params.id);
  sendSuccess(res, { members });
});

export const addProjectMember = asyncHandler(async (req: Request, res: Response) => {
  const member = await projectService.addProjectMember(req.params.id, req.user!._id, req.body);
  sendSuccess(res, { member }, 201, 'Member added');
});

export const updateProjectMemberRole = asyncHandler(async (req: Request, res: Response) => {
  const member = await projectService.updateProjectMemberRole(
    req.params.id,
    req.params.memberId,
    req.body.role
  );
  sendSuccess(res, { member });
});

export const removeProjectMember = asyncHandler(async (req: Request, res: Response) => {
  await projectService.removeProjectMember(req.params.id, req.params.memberId, req.user!._id);
  sendSuccess(res, null, 200, 'Member removed');
});
