import { Request, Response } from 'express';
import { sprintService } from '../services/sprint.service';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const createSprint = asyncHandler(async (req: Request, res: Response) => {
  const sprint = await sprintService.createSprint(req.params.projectId, req.body);
  sendSuccess(res, { sprint }, 201);
});

export const getSprints = asyncHandler(async (req: Request, res: Response) => {
  const sprints = await sprintService.getSprints(req.params.projectId);
  sendSuccess(res, { sprints });
});

export const updateSprint = asyncHandler(async (req: Request, res: Response) => {
  const sprint = await sprintService.updateSprint(req.params.id, req.body);
  sendSuccess(res, { sprint });
});

export const deleteSprint = asyncHandler(async (req: Request, res: Response) => {
  await sprintService.deleteSprint(req.params.id);
  sendSuccess(res, null, 200, 'Sprint deleted');
});

export const startSprint = asyncHandler(async (req: Request, res: Response) => {
  const sprint = await sprintService.startSprint(req.params.id, req.params.projectId, req.user!._id);
  sendSuccess(res, { sprint });
});

export const completeSprint = asyncHandler(async (req: Request, res: Response) => {
  const result = await sprintService.completeSprint(req.params.id, req.params.projectId, req.user!._id, req.body);
  sendSuccess(res, result);
});

export const getBacklog = asyncHandler(async (req: Request, res: Response) => {
  const issues = await sprintService.getBacklog(req.params.projectId);
  sendSuccess(res, { issues });
});
