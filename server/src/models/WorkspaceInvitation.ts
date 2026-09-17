import mongoose, { Document, Model, Schema } from 'mongoose';
import { WorkspaceRole } from '@taskflow/shared';

export interface IWorkspaceInvitationDocument extends Document {
  _id: mongoose.Types.ObjectId;
  workspace: mongoose.Types.ObjectId;
  email: string;
  role: WorkspaceRole;
  tokenHash: string;
  invitedBy: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'revoked';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const workspaceInvitationSchema = new Schema<IWorkspaceInvitationDocument>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    tokenHash: { type: String, required: true, select: false },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'revoked'], default: 'pending', index: true },
    expiresAt: { type: Date, required: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        delete ret.tokenHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

workspaceInvitationSchema.index({ workspace: 1, email: 1, status: 1 });
workspaceInvitationSchema.index({ tokenHash: 1 });

export const WorkspaceInvitation: Model<IWorkspaceInvitationDocument> =
  mongoose.model<IWorkspaceInvitationDocument>('WorkspaceInvitation', workspaceInvitationSchema);
