import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISessionDocument extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  refreshTokenHash: string;
  userAgent: string;
  ipAddress: string;
  lastActiveAt: Date;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISessionDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    refreshTokenHash: { type: String, required: true, select: false },
    userAgent: { type: String, default: 'Unknown' },
    ipAddress: { type: String, default: '127.0.0.1' },
    lastActiveAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: { expires: '7d' } },
    isRevoked: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        delete ret.refreshTokenHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

sessionSchema.index({ user: 1, isRevoked: 1 });
sessionSchema.index({ refreshTokenHash: 1 });

export const Session: Model<ISessionDocument> = mongoose.model<ISessionDocument>('Session', sessionSchema);
