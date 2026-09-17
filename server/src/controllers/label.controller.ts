import { Request, Response } from 'express';
import { labelService } from '../services/label.service';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const getLabels = asyncHandler(async (req: Request, res: Response) => {
  const labels = await labelService.getLabels(req.params.projectId);
  sendSuccess(res, { labels });
});

export const createLabel = asyncHandler(async (req: Request, res: Response) => {
  const label = await labelService.createLabel(req.params.projectId, req.body.name, req.body.color);
  sendSuccess(res, { label }, 201);
});

export const updateLabel = asyncHandler(async (req: Request, res: Response) => {
  const label = await labelService.updateLabel(req.params.labelId, req.body.name, req.body.color);
  sendSuccess(res, { label });
});

export const deleteLabel = asyncHandler(async (req: Request, res: Response) => {
  await labelService.deleteLabel(req.params.labelId);
  sendSuccess(res, null, 200, 'Label deleted');
});
