import { Router } from 'express';
import { getBoard, createColumn, updateColumn, deleteColumn, reorderColumns } from '../controllers/board.controller';
import { requireAuth } from '../middleware/auth';
import { requireProjectMember, requireProjectAdmin } from '../middleware/authorization';

const boardRouter = Router({ mergeParams: true });
boardRouter.use(requireAuth);
boardRouter.get('/', requireProjectMember(), getBoard);
boardRouter.post('/columns', requireProjectAdmin, createColumn);
boardRouter.patch('/columns/:columnId', requireProjectAdmin, updateColumn);
boardRouter.delete('/columns/:columnId', requireProjectAdmin, deleteColumn);
boardRouter.post('/columns/reorder', requireProjectAdmin, reorderColumns);

export { boardRouter };
