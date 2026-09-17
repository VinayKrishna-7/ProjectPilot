import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ILabelDocument extends Document {
  _id: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

const labelSchema = new Schema<ILabelDocument>(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 50 },
    color: { type: String, required: true, default: '#3B82F6', match: /^#[0-9A-Fa-f]{6}$/ },
  },
  {
    timestamps: true,
    toJSON: { transform: (_doc, ret: any) => { delete ret.__v; return ret; } },
  }
);

labelSchema.index({ project: 1, name: 1 }, { unique: true });

export const Label: Model<ILabelDocument> = mongoose.model<ILabelDocument>('Label', labelSchema);
