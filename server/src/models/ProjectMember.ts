import mongoose, { Document, Model, Schema } from 'mongoose';
import { ProjectRole } from '@taskflow/shared';

export interface IProjectMemberDocument extends Document {
  _id: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  role: ProjectRole;
  joinedAt: Date;
}

const projectMemberSchema = new Schema<IProjectMemberDocument>(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    toJSON: { transform: (_doc, ret: any) => { delete ret.__v; return ret; } },
  }
);

projectMemberSchema.index({ project: 1, user: 1 }, { unique: true });

export const ProjectMember: Model<IProjectMemberDocument> =
  mongoose.model<IProjectMemberDocument>('ProjectMember', projectMemberSchema);
