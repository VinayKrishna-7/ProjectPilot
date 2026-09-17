import { Router } from 'express';
import {
  createIssue,
  getIssues,
  getIssue,
  updateIssue,
  moveIssue,
  deleteIssue,
  getIssueActivities,
} from '../controllers/issue.controller';
import { requireAuth } from '../middleware/auth';
import { requireProjectMember } from '../middleware/authorization';
import { validate } from '../middleware/validate';
import { createIssueSchema, updateIssueSchema, moveIssueSchema } from '../validators/issue.validator';

const projectIssuesRouter = Router({ mergeParams: true });
projectIssuesRouter.use(requireAuth);
projectIssuesRouter.get('/', requireProjectMember(), getIssues);
projectIssuesRouter.post('/', requireProjectMember(), validate(createIssueSchema), createIssue);

const issueRouter = Router();
issueRouter.use(requireAuth);
issueRouter.get('/:id', getIssue);
issueRouter.patch('/:id', validate(updateIssueSchema), updateIssue);
issueRouter.patch('/:id/move', validate(moveIssueSchema), moveIssue);
issueRouter.delete('/:id', deleteIssue);
issueRouter.get('/:id/activities', getIssueActivities);

export { projectIssuesRouter, issueRouter };
