import { Router } from 'express';
import { getProjectStats } from '../controllers/stats.controller';
import { requireAuth } from '../middleware/auth';
import { requireProjectMember } from '../middleware/authorization';

const statsRouter = Router({ mergeParams: true });
statsRouter.use(requireAuth);
statsRouter.get('/', requireProjectMember(), getProjectStats);

export { statsRouter };
