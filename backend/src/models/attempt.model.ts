import { Schema, model, Document, Types } from 'mongoose';
import { ATTEMPT_STATUS } from '../constants/attemptStatus';

export interface IAttempt extends Document {
  quiz_id: Types.ObjectId;
  user_id: Types.ObjectId;
  status: string;
  score: number | null;
  total_questions: number;
  started_at: Date;
  submitted_at: Date | null;
}

const attemptSchema = new Schema<IAttempt>(
  {
    quiz_id: {
      type: Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      default: ATTEMPT_STATUS.IN_PROGRESS,
      enum: Object.values(ATTEMPT_STATUS),
      trim: true,
    },
    score: {
      type: Number,
      default: null,
    },
    total_questions: {
      type: Number,
      required: true,
    },
    started_at: {
      type: Date,
      default: Date.now,
      required: true,
    },
    submitted_at: {
      type: Date,
      default: null,
    },
  },
  {
    toJSON: {
      transform: (_doc, ret) => {
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

// Unique index on (user_id, quiz_id) to block re-attempt at DB level
attemptSchema.index({ user_id: 1, quiz_id: 1 }, { unique: true });

export const Attempt = model<IAttempt>('Attempt', attemptSchema);