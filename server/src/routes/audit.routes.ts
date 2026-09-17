import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireWorkspaceAdmin } from '../middleware/authorization';
import { auditService } from '../services/audit.service';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router({ mergeParams: true });

router.get(
  '/',
  requireAuth,
  requireWorkspaceAdmin,
  asyncHandler(async (req, res) => {
    const workspaceId = req.params.workspaceId;
    const { action, actor, entityType, startDate, endDate, page, limit } = req.query;

    const result = await auditService.getWorkspaceLogs(workspaceId, {
      action: action as string,
      actor: actor as string,
      entityType: entityType as string,
      startDate: startDate as string,
      endDate: endDate as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    sendSuccess(res, result);
  })
);

export default router;
