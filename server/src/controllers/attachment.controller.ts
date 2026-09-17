import { Request, Response } from 'express';
import { attachmentService } from '../services/attachment.service';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';

export const uploadAttachment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError('No file provided', 400, 'NO_FILE');
  const attachment = await attachmentService.uploadAttachment(req.params.issueId, req.user!._id, req.file);
  sendSuccess(res, { attachment }, 201);
});

export const deleteAttachment = asyncHandler(async (req: Request, res: Response) => {
  await attachmentService.deleteAttachment(req.params.id, req.user!._id);
  sendSuccess(res, null, 200, 'Attachment deleted');
});

export const getAttachments = asyncHandler(async (req: Request, res: Response) => {
  const attachments = await attachmentService.getAttachments(req.params.issueId);
  sendSuccess(res, { attachments });
});
