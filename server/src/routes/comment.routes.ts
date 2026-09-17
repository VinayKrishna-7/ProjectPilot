import { Router } from 'express';
import { getComments, createComment, updateComment, deleteComment } from '../controllers/comment.controller';
import { requireAuth } from '../middleware/auth';

const issueCommentRouter = Router({ mergeParams: true });
issueCommentRouter.use(requireAuth);
issueCommentRouter.get('/', getComments);
issueCommentRouter.post('/', createComment);

const commentRouter = Router();
commentRouter.use(requireAuth);
commentRouter.patch('/:id', updateComment);
commentRouter.delete('/:id', deleteComment);

export { issueCommentRouter, commentRouter };
