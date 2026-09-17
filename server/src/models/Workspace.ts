import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IWorkspaceDocument extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  owner: mongoose.Types.ObjectId;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

const workspaceSchema = new Schema<IWorkspaceDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: /^[a-z0-9-]+$/,
    },
    description: { type: String, maxlength: 500 },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    avatar: { type: String },
  },
  {
    timestamps: true,
    toJSON: { transform: (_doc, ret: any) => { delete ret.__v; return ret; } },
  }
);

workspaceSchema.index({ owner: 1 });

export const Workspace: Model<IWorkspaceDocument> = mongoose.model<IWorkspaceDocument>('Workspace', workspaceSchema);
