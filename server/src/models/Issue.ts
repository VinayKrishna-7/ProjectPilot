import mongoose, { Document, Model, Schema } from 'mongoose';
import { IssueType, IssuePriority, IssueStatus } from '@taskflow/shared';

export interface IIssueDocument extends Document {
  _id: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  key: string;
  title: string;
  description?: string;
  type: IssueType;
  status: IssueStatus;
  priority: IssuePriority;
  reporter: mongoose.Types.ObjectId;
  assignee?: mongoose.Types.ObjectId;
  labels: mongoose.Types.ObjectId[];
  sprint?: mongoose.Types.ObjectId;
  boardColumn?: mongoose.Types.ObjectId;
  position: number;
  storyPoints?: number;
  dueDate?: Date;
  parentIssue?: mongoose.Types.ObjectId;
  attachments: mongoose.Types.ObjectId[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const issueSchema = new Schema<IIssueDocument>(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    key: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 500 },
    description: { type: String, maxlength: 10000 },
    type: {
      type: String,
      enum: ['task', 'bug', 'story', 'epic'],
      default: 'task',
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'review', 'done'],
      default: 'todo',
    },
    priority: {
      type: String,
      enum: ['lowest', 'low', 'medium', 'high', 'highest'],
      default: 'medium',
    },
    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignee: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    labels: [{ type: Schema.Types.ObjectId, ref: 'Label' }],
    sprint: { type: Schema.Types.ObjectId, ref: 'Sprint', index: true },
    boardColumn: { type: Schema.Types.ObjectId, ref: 'BoardColumn', index: true },
    position: { type: Number, default: 0 },
    storyPoints: { type: Number, min: 0, max: 100 },
    dueDate: { type: Date },
    parentIssue: { type: Schema.Types.ObjectId, ref: 'Issue' },
    attachments: [{ type: Schema.Types.ObjectId, ref: 'Attachment' }],
    version: { type: Number, default: 1 },
  },
  {
    timestamps: true,
    toJSON: { transform: (_doc, ret: any) => { delete ret.__v; return ret; } },
  }
);

issueSchema.index({ project: 1, key: 1 }, { unique: true });
issueSchema.index({ project: 1, status: 1 });
issueSchema.index({ project: 1, sprint: 1 });
issueSchema.index({ project: 1, boardColumn: 1, position: 1 });
issueSchema.index({ project: 1, assignee: 1 });
issueSchema.index({ title: 'text', description: 'text', key: 'text' });

export const Issue: Model<IIssueDocument> = mongoose.model<IIssueDocument>('Issue', issueSchema);
