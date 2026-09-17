import { Router } from 'express';
import {
  createSprint,
  getSprints,
  updateSprint,
  deleteSprint,
  startSprint,
  completeSprint,
  getBacklog,
} from '../controllers/sprint.controller';
import { requireAuth } from '../middleware/auth';
import { requireProjectMember, requireProjectAdmin } from '../middleware/authorization';
import { validate } from '../middleware/validate';
import { createSprintSchema, updateSprintSchema, completeSprintSchema } from '../validators/sprint.validator';

const sprintRouter = Router({ mergeParams: true });
sprintRouter.use(requireAuth);
sprintRouter.get('/', requireProjectMember(), getSprints);
sprintRouter.post('/', requireProjectAdmin, validate(createSprintSchema), createSprint);
sprintRouter.get('/backlog', requireProjectMember(), getBacklog);
sprintRouter.patch('/:id', requireProjectAdmin, validate(updateSprintSchema), updateSprint);
sprintRouter.delete('/:id', requireProjectAdmin, deleteSprint);
sprintRouter.post('/:id/start', requireProjectAdmin, startSprint);
sprintRouter.post('/:id/complete', requireProjectAdmin, validate(completeSprintSchema), completeSprint);

export { sprintRouter };
