import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireProjectMember } from '../middleware/authorization';
import { savedFilterService } from '../services/savedFilter.service';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const projectSavedFilterRouter = Router({ mergeParams: true });
export const savedFilterRouter = Router();

// Mounted on /api/projects/:projectId/saved-filters
projectSavedFilterRouter.get(
  '/',
  requireAuth,
  requireProjectMember(),
  asyncHandler(async (req, res) => {
    const filters = await savedFilterService.getFilters(
      req.params.projectId,
      req.user!._id
    );
    sendSuccess(res, { filters });
  })
);

projectSavedFilterRouter.post(
  '/',
  requireAuth,
  requireProjectMember(),
  asyncHandler(async (req, res) => {
    const filter = await savedFilterService.createFilter(
      req.params.projectId,
      req.user!._id,
      req.body
    );
    sendSuccess(res, { filter }, 201, 'Filter saved successfully');
  })
);

// Mounted on /api/saved-filters/:id
savedFilterRouter.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    await savedFilterService.deleteFilter(req.params.id, req.user!._id);
    sendSuccess(res, null, 200, 'Filter deleted');
  })
);
