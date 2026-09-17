import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireProjectMember } from '../middleware/authorization';
import { jqlService } from '../services/jql.service';
import { Issue } from '../models/Issue';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router({ mergeParams: true });

router.get(
  '/search',
  requireAuth,
  requireProjectMember(),
  asyncHandler(async (req, res) => {
    const projectId = req.params.projectId;
    const queryStr = (req.query.q as string) || '';
    const userId = req.user!._id.toString();

    const compileResult = await jqlService.parseAndCompile(queryStr, projectId, userId);
    if (!compileResult.valid) {
      return sendError(res, 400, 'INVALID_JQL', compileResult.error || 'Syntax error in JQL query');
    }

    const issues = await Issue.find(compileResult.mongoQuery || { project: projectId })
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email avatar')
      .populate('labels', 'name color')
      .populate('sprint', 'name status')
      .populate('boardColumn', 'name status color')
      .sort(compileResult.sort || { position: 1 })
      .limit(100);

    sendSuccess(res, {
      query: queryStr,
      count: issues.length,
      issues,
    });
  })
);

router.get(
  '/suggest',
  requireAuth,
  requireProjectMember(),
  asyncHandler(async (req, res) => {
    const queryStr = (req.query.q as string) || '';
    const suggestions = jqlService.getSuggestions(queryStr);
    sendSuccess(res, { suggestions });
  })
);

export default router;
