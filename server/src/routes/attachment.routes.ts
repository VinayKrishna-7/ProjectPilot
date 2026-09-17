import { Router } from 'express';
import multer from 'multer';
import { uploadAttachment, deleteAttachment, getAttachments } from '../controllers/attachment.controller';
import { requireAuth } from '../middleware/auth';
import { env } from '../config/env';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'text/plain', 'text/csv',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('File type not allowed'));
  },
});

const issueAttachmentRouter = Router({ mergeParams: true });
issueAttachmentRouter.use(requireAuth);
issueAttachmentRouter.get('/', getAttachments);
issueAttachmentRouter.post('/', upload.single('file'), uploadAttachment);

const attachmentRouter = Router();
attachmentRouter.use(requireAuth);
attachmentRouter.delete('/:id', deleteAttachment);

export { issueAttachmentRouter, attachmentRouter };
