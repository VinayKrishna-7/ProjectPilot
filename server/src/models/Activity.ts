import mongoose, { Document, Model, Schema } from 'mongoose';
import { ActivityType } from '@taskflow/shared';

export interface IActivityDocument extends Document {
  _id: mongoose.Types.ObjectId;
  workspace?: mongoose.Types.ObjectId;
  project?: mongoose.Types.ObjectId;
  issue?: mongoose.Types.ObjectId;
  actor: mongoose.Types.ObjectId;
  type: ActivityType;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

const activitySchema = new Schema<IActivityDocument>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', index: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', index: true },
    issue: { type: Schema.Types.ObjectId, ref: 'Issue', index: true },
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      required: true,
      enum: [
        'issue_created', 'issue_updated', 'status_changed', 'priority_changed',
        'assignee_changed', 'sprint_changed', 'label_added', 'label_removed',
        'comment_created', 'comment_updated', 'comment_deleted',
        'attachment_added', 'attachment_removed', 'issue_deleted',
      ],
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { transform: (_doc, ret: any) => { delete ret.__v; return ret; } },
  }
);

activitySchema.index({ issue: 1, createdAt: -1 });
activitySchema.index({ project: 1, createdAt: -1 });

export const Activity: Model<IActivityDocument> = mongoose.model<IActivityDocument>('Activity', activitySchema);
