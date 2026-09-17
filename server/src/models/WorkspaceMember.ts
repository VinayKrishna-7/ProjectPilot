import mongoose, { Document, Model, Schema } from 'mongoose';
import { WorkspaceRole } from '@taskflow/shared';

export interface IWorkspaceMemberDocument extends Document {
  _id: mongoose.Types.ObjectId;
  workspace: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  role: WorkspaceRole;
  joinedAt: Date;
}

const workspaceMemberSchema = new Schema<IWorkspaceMemberDocument>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member',
    },
    joinedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    toJSON: { transform: (_doc, ret: any) => { delete ret.__v; return ret; } },
  }
);

workspaceMemberSchema.index({ workspace: 1, user: 1 }, { unique: true });

export const WorkspaceMember: Model<IWorkspaceMemberDocument> =
  mongoose.model<IWorkspaceMemberDocument>('WorkspaceMember', workspaceMemberSchema);
