import mongoose, { Document, Model, Schema } from 'mongoose';
import { SprintStatus } from '@taskflow/shared';

export interface ISprintDocument extends Document {
  _id: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  name: string;
  goal?: string;
  startDate?: Date;
  endDate?: Date;
  status: SprintStatus;
  createdAt: Date;
  updatedAt: Date;
}

const sprintSchema = new Schema<ISprintDocument>(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    goal: { type: String, maxlength: 500 },
    startDate: { type: Date },
    endDate: { type: Date },
    status: {
      type: String,
      enum: ['planned', 'active', 'completed'],
      default: 'planned',
    },
  },
  {
    timestamps: true,
    toJSON: { transform: (_doc, ret: any) => { delete ret.__v; return ret; } },
  }
);

sprintSchema.index({ project: 1, status: 1 });

export const Sprint: Model<ISprintDocument> = mongoose.model<ISprintDocument>('Sprint', sprintSchema);
