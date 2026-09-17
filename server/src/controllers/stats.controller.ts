import { Request, Response } from 'express';
import { statsService } from '../services/stats.service';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const getProjectStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await statsService.getProjectStats(req.params.projectId);
  sendSuccess(res, { stats });
});
