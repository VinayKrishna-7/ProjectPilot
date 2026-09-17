import mongoose from 'mongoose';
import { Attachment, IAttachmentDocument } from '../models/Attachment';
import { Issue } from '../models/Issue';
import { cloudinary } from '../config/cloudinary';
import { AppError } from '../utils/AppError';
import { Activity } from '../models/Activity';
import { env } from '../config/env';

export class AttachmentService {
  async uploadAttachment(
    issueId: string,
    uploaderId: mongoose.Types.ObjectId,
    file: Express.Multer.File
  ): Promise<IAttachmentDocument> {
    const issue = await Issue.findById(issueId);
    if (!issue) throw new AppError('Issue not found', 404, 'ISSUE_NOT_FOUND');

    let secureUrl = '';
    let publicId = '';

    if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY) {
      const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: `projectpilot/issues/${issueId}`, resource_type: 'auto' },
          (error, res) => {
            if (error || !res) reject(error || new Error('Upload failed'));
            else resolve(res as { secure_url: string; public_id: string });
          }
        );
        stream.end(file.buffer);
      });
      secureUrl = result.secure_url;
      publicId = result.public_id;
    } else {
      // Local development fallback if Cloudinary credentials are not configured
      const base64Data = file.buffer.toString('base64');
      secureUrl = `data:${file.mimetype};base64,${base64Data}`;
      publicId = `local_${Date.now()}_${file.originalname}`;
    }

    const attachment = await Attachment.create({
      issue: issueId,
      uploadedBy: uploaderId,
      fileName: file.originalname,
      url: secureUrl,
      publicId,
      mimeType: file.mimetype,
      size: file.size,
    });

    await Issue.findByIdAndUpdate(issueId, { $push: { attachments: attachment._id } });
    await Activity.create({
      project: issue.project,
      issue: issueId,
      actor: uploaderId,
      type: 'attachment_added',
      metadata: { fileName: file.originalname },
    });

    return attachment.populate('uploadedBy', 'name email avatar');
  }

  async deleteAttachment(
    attachmentId: string,
    _userId: mongoose.Types.ObjectId
  ): Promise<void> {
    const attachment = await Attachment.findById(attachmentId);
    if (!attachment) throw new AppError('Attachment not found', 404, 'ATTACHMENT_NOT_FOUND');

    if (attachment.publicId && !attachment.publicId.startsWith('local_') && env.CLOUDINARY_CLOUD_NAME) {
      try {
        await cloudinary.uploader.destroy(attachment.publicId, { resource_type: 'auto' });
      } catch (err) {
        console.warn('Failed to delete from Cloudinary:', err);
      }
    }

    await Issue.findByIdAndUpdate(attachment.issue, { $pull: { attachments: attachmentId } });
    await Attachment.findByIdAndDelete(attachmentId);
  }

  async getAttachments(issueId: string): Promise<IAttachmentDocument[]> {
    return Attachment.find({ issue: issueId })
      .populate('uploadedBy', 'name email avatar')
      .sort({ createdAt: -1 });
  }
}

export const attachmentService = new AttachmentService();
