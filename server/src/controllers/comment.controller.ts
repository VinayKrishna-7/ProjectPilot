import { Request, Response } from 'express';
import { commentService } from '../services/comment.service';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const getComments = asyncHandler(async (req: Request, res: Response) => {
  const comments = await commentService.getComments(req.params.issueId);
  sendSuccess(res, { comments });
});

export const createComment = asyncHandler(async (req: Request, res: Response) => {
  const comment = await commentService.createComment(req.params.issueId, req.user!._id, req.body.content);
  sendSuccess(res, { comment }, 201);
});

export const updateComment = asyncHandler(async (req: Request, res: Response) => {
  const comment = await commentService.updateComment(req.params.id, req.user!._id, req.body.content);
  sendSuccess(res, { comment });
});

export const deleteComment = asyncHandler(async (req: Request, res: Response) => {
  await commentService.deleteComment(req.params.id, req.user!._id);
  sendSuccess(res, null, 200, 'Comment deleted');
});
