import { Schema, model, Document, Types } from 'mongoose';

export interface IOption extends Document {
  question_id: Types.ObjectId;
  option_text: string;
  is_correct: boolean;
  order_index: number;
}

const optionSchema = new Schema<IOption>(
  {
    question_id: {
      type: Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
      index: true,
    },
    option_text: {
      type: String,
      required: true,
      trim: true,
    },
    is_correct: {
      type: Boolean,
      required: true,
    },
    order_index: {
      type: Number,
      required: true,
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

export const Option = model<IOption>('Option', optionSchema);
