import { z } from 'zod';
import { objectIdSchema } from './shared.validator';

const optionInputSchema = z.object({
  option_text: z
    .string({ message: 'Option text is required' })
    .trim()
    .min(1, 'Option text cannot be empty')
    .max(200, 'Option text must be less than 200 characters'),
  is_correct: z.boolean({ message: 'is_correct flag is required' }),
  order_index: z
    .number({ message: 'Option order index is required' })
    .int('Option order index must be an integer')
    .min(0, 'Option order index cannot be negative'),
});

export const createQuestionSchema = z.object({
  params: z.object({
    id: objectIdSchema, // quizId
  }),
  body: z.object({
    question_text: z
      .string({ message: 'Question text is required' })
      .trim()
      .min(3, 'Question text must be at least 3 characters')
      .max(1000, 'Question text must be less than 1000 characters'),
    question_type: z.string().trim().default('mcq'),
    order_index: z
      .number({ message: 'Question order index is required' })
      .int('Question order index must be an integer')
      .min(0, 'Question order index cannot be negative'),
    points: z
      .number()
      .int('Points must be an integer')
      .positive('Points must be greater than 0')
      .default(1),
    options: z
      .array(optionInputSchema)
      .min(2, 'A question must have at least 2 options')
      .max(10, 'A question can have at most 10 options'),
  }),
});

export const getQuestionsSchema = z.object({
  params: z.object({
    id: objectIdSchema, // quizId
  }),
});

export const updateQuestionSchema = z.object({
  params: z.object({
    id: objectIdSchema, // quizId
    qid: objectIdSchema, // questionId
  }),
  body: z.object({
    question_text: z
      .string()
      .trim()
      .min(3, 'Question text must be at least 3 characters')
      .max(1000, 'Question text must be less than 1000 characters')
      .optional(),
    question_type: z.string().trim().optional(),
    order_index: z
      .number()
      .int('Question order index must be an integer')
      .min(0, 'Question order index cannot be negative')
      .optional(),
    points: z
      .number()
      .int('Points must be an integer')
      .positive('Points must be greater than 0')
      .optional(),
    options: z
      .array(optionInputSchema)
      .min(2, 'A question must have at least 2 options')
      .max(10, 'A question can have at most 10 options')
      .optional(),
  }),
});

export const deleteQuestionSchema = z.object({
  params: z.object({
    id: objectIdSchema, // quizId
    qid: objectIdSchema, // questionId
  }),
});
