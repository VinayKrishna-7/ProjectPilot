import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISavedFilterDocument extends Document {
  _id: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  jql?: string;
  filterConfig?: {
    status?: string[];
    priority?: string[];
    type?: string[];
    assignee?: string[];
    search?: string;
  };
  isShared: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const savedFilterSchema = new Schema<ISavedFilterDocument>(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, maxlength: 500 },
    jql: { type: String, maxlength: 1000 },
    filterConfig: { type: Schema.Types.Mixed, default: {} },
    isShared: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

savedFilterSchema.index({ project: 1, user: 1 });
savedFilterSchema.index({ project: 1, isShared: 1 });

export const SavedFilter: Model<ISavedFilterDocument> = mongoose.model<ISavedFilterDocument>('SavedFilter', savedFilterSchema);
