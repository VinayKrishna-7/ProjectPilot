import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IAttachmentDocument extends Document {
  _id: mongoose.Types.ObjectId;
  issue: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  fileName: string;
  url: string;
  publicId: string;
  mimeType: string;
  size: number;
  createdAt: Date;
}

const attachmentSchema = new Schema<IAttachmentDocument>(
  {
    issue: { type: Schema.Types.ObjectId, ref: 'Issue', required: true, index: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fileName: { type: String, required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { transform: (_doc, ret: any) => { delete ret.__v; return ret; } },
  }
);

export const Attachment: Model<IAttachmentDocument> =
  mongoose.model<IAttachmentDocument>('Attachment', attachmentSchema);
