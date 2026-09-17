import { Request, Response } from 'express';
import { issueService } from '../services/issue.service';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const createIssue = asyncHandler(async (req: Request, res: Response) => {
  const issue = await issueService.createIssue(req.params.projectId, req.user!._id, req.body);
  sendSuccess(res, { issue }, 201, 'Issue created');
});

export const getIssues = asyncHandler(async (req: Request, res: Response) => {
  const filter = {
    ...req.query,
    page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
  };
  const result = await issueService.getIssues(req.params.projectId, filter as any);
  sendSuccess(res, result);
});

export const getIssue = asyncHandler(async (req: Request, res: Response) => {
  const issue = await issueService.getIssueById(req.params.id);
  sendSuccess(res, { issue });
});

export const updateIssue = asyncHandler(async (req: Request, res: Response) => {
  const issue = await issueService.updateIssue(req.params.id, req.user!._id, req.body);
  sendSuccess(res, { issue });
});

export const moveIssue = asyncHandler(async (req: Request, res: Response) => {
  const issue = await issueService.moveIssue(req.params.id, req.user!._id, req.body);
  sendSuccess(res, { issue });
});

export const deleteIssue = asyncHandler(async (req: Request, res: Response) => {
  await issueService.deleteIssue(req.params.id, req.user!._id);
  sendSuccess(res, null, 200, 'Issue deleted');
});

export const getIssueActivities = asyncHandler(async (req: Request, res: Response) => {
  const activities = await issueService.getIssueActivities(req.params.id);
  sendSuccess(res, { activities });
});
