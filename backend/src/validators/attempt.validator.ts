import { z } from 'zod';
import { objectIdSchema } from './shared.validator';

export const startAttemptSchema = z.object({
  params: z.object({
    id: objectIdSchema, // quizId
  }),
});

export const getAttemptsHistorySchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined))
      .refine((val) => val === undefined || val > 0, {
        message: 'Page must be a positive integer',
      }),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined))
      .refine((val) => val === undefined || val > 0, {
        message: 'Limit must be a positive integer',
      }),
  }),
});

export const attemptIdParamsSchema = z.object({
  params: z.object({
    id: objectIdSchema, // attemptId
  }),
});

export const submitAnswerSchema = z.object({
  params: z.object({
    id: objectIdSchema, // attemptId
  }),
  body: z.object({
    question_id: objectIdSchema,
    selected_option_id: objectIdSchema.nullable(), // Null represents skipped or timed out answer
  }),
});
