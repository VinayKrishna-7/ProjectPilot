import mongoose, { Document, Model, Schema } from 'mongoose';
import { NotificationType } from '@taskflow/shared';

export interface INotificationDocument extends Document {
  _id: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  actor?: mongoose.Types.ObjectId;
  type: NotificationType;
  message: string;
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotificationDocument>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actor: { type: Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      required: true,
      enum: [
        'issue_assigned', 'issue_mentioned', 'issue_commented',
        'issue_status_changed', 'sprint_started', 'sprint_completed',
        'workspace_invitation', 'project_invitation',
        'member_added', 'member_removed',
      ],
    },
    message: { type: String, required: true, maxlength: 500 },
    entityType: { type: String },
    entityId: { type: String },
    isRead: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { transform: (_doc, ret: any) => { delete ret.__v; return ret; } },
  }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export const Notification: Model<INotificationDocument> =
  mongoose.model<INotificationDocument>('Notification', notificationSchema);
