import mongoose, { Document, Model, Schema } from 'mongoose';
import { ProjectStatus } from '@taskflow/shared';

export interface IProjectDocument extends Document {
  _id: mongoose.Types.ObjectId;
  workspace: mongoose.Types.ObjectId;
  name: string;
  key: string;
  description?: string;
  lead?: mongoose.Types.ObjectId;
  avatar?: string;
  status: ProjectStatus;
  lastIssueNumber: number;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProjectDocument>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    key: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      maxlength: 10,
      match: /^[A-Z][A-Z0-9]+$/,
    },
    description: { type: String, maxlength: 1000 },
    lead: { type: Schema.Types.ObjectId, ref: 'User' },
    avatar: { type: String },
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
    lastIssueNumber: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { transform: (_doc, ret: any) => { delete ret.__v; return ret; } },
  }
);

projectSchema.index({ workspace: 1, key: 1 }, { unique: true });
projectSchema.index({ workspace: 1, status: 1 });

export const Project: Model<IProjectDocument> = mongoose.model<IProjectDocument>('Project', projectSchema);
