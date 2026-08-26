import { Schema, model, Document, Types } from 'mongoose';

export interface IQuestion extends Document {
  quiz_id: Types.ObjectId;
  question_text: string;
  question_type: string;
  order_index: number;
  points: number;
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<IQuestion>(
  {
    quiz_id: {
      type: Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
    },
    question_text: {
      type: String,
      required: true,
      trim: true,
    },
    question_type: {
      type: String,
      default: 'mcq',
      trim: true,
    },
    order_index: {
      type: Number,
      required: true,
    },
    points: {
      type: Number,
      default: 1,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

export const Question = model<IQuestion>('Question', questionSchema);