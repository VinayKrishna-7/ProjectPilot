import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IBoardDocument extends Document {
  _id: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const boardSchema = new Schema<IBoardDocument>(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, unique: true, index: true },
    name: { type: String, required: true, default: 'Main Board' },
  },
  {
    timestamps: true,
    toJSON: { transform: (_doc, ret: any) => { delete ret.__v; return ret; } },
  }
);

export const Board: Model<IBoardDocument> = mongoose.model<IBoardDocument>('Board', boardSchema);
