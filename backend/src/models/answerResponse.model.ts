import { Schema, model, Document, Types } from 'mongoose';

export interface IAnswerResponse extends Document {
  attempt_id: Types.ObjectId;
  question_id: Types.ObjectId;
  selected_option_id: Types.ObjectId | null;
  is_correct: boolean;
}

const answerResponseSchema = new Schema<IAnswerResponse>(
  {
    attempt_id: {
      type: Schema.Types.ObjectId,
      ref: 'Attempt',
      required: true,
      index: true,
    },
    question_id: {
      type: Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    selected_option_id: {
      type: Schema.Types.ObjectId,
      ref: 'Option',
      default: null,
    },
    is_correct: {
      type: Boolean,
      default: false,
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

// Unique index on (attempt_id, question_id) to ensure one response per question per attempt
answerResponseSchema.index({ attempt_id: 1, question_id: 1 }, { unique: true });

export const AnswerResponse = model<IAnswerResponse>('AnswerResponse', answerResponseSchema);
