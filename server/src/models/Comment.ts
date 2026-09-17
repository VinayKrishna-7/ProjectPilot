import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICommentDocument extends Document {
  _id: mongoose.Types.ObjectId;
  issue: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<ICommentDocument>(
  {
    issue: { type: Schema.Types.ObjectId, ref: 'Issue', required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true, maxlength: 10000 },
  },
  {
    timestamps: true,
    toJSON: { transform: (_doc, ret: any) => { delete ret.__v; return ret; } },
  }
);

commentSchema.index({ issue: 1, createdAt: 1 });

export const Comment: Model<ICommentDocument> = mongoose.model<ICommentDocument>('Comment', commentSchema);
