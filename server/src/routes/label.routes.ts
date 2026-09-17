import { Router } from 'express';
import { getLabels, createLabel, updateLabel, deleteLabel } from '../controllers/label.controller';
import { requireAuth } from '../middleware/auth';
import { requireProjectMember, requireProjectAdmin } from '../middleware/authorization';

const labelRouter = Router({ mergeParams: true });
labelRouter.use(requireAuth);
labelRouter.get('/', requireProjectMember(), getLabels);
labelRouter.post('/', requireProjectMember(), createLabel);
labelRouter.patch('/:labelId', requireProjectAdmin, updateLabel);
labelRouter.delete('/:labelId', requireProjectAdmin, deleteLabel);

export { labelRouter };
