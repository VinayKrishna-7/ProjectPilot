import mongoose, { Document, Model, Schema } from 'mongoose';
import { IssueStatus } from '@taskflow/shared';

export interface IBoardColumnDocument extends Document {
  _id: mongoose.Types.ObjectId;
  board: mongoose.Types.ObjectId;
  name: string;
  position: number;
  color?: string;
  status: IssueStatus;
  createdAt: Date;
  updatedAt: Date;
}

const boardColumnSchema = new Schema<IBoardColumnDocument>(
  {
    board: { type: Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 50 },
    position: { type: Number, required: true },
    color: { type: String, default: '#6B7280' },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'review', 'done'],
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { transform: (_doc, ret: any) => { delete ret.__v; return ret; } },
  }
);

boardColumnSchema.index({ board: 1, position: 1 });
boardColumnSchema.index({ board: 1, status: 1 });

export const BoardColumn: Model<IBoardColumnDocument> =
  mongoose.model<IBoardColumnDocument>('BoardColumn', boardColumnSchema);
