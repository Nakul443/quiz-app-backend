// file to 

import { z } from 'zod';
import { objectIdSchema } from './shared.validator';

export const createQuizSchema = z.object({
  body: z.object({
    title: z
      .string({ message: 'Title is required' })
      .trim()
      .min(3, 'Title must be at least 3 characters')
      .max(100, 'Title must be less than 100 characters'),
    description: z
      .string({ message: 'Description is required' })
      .trim()
      .min(5, 'Description must be at least 5 characters')
      .max(500, 'Description must be less than 500 characters'),
    time_limit: z
      .number({ message: 'Time limit is required' })
      .int('Time limit must be an integer')
      .positive('Time limit must be a positive number'),
  }),
});

export const getQuizzesSchema = z.object({
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

export const quizIdParamsSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const updateQuizSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    title: z
      .string()
      .trim()
      .min(3, 'Title must be at least 3 characters')
      .max(100, 'Title must be less than 100 characters')
      .optional(),
    description: z
      .string()
      .trim()
      .min(5, 'Description must be at least 5 characters')
      .max(500, 'Description must be less than 500 characters')
      .optional(),
    time_limit: z
      .number()
      .int('Time limit must be an integer')
      .positive('Time limit must be a positive number')
      .optional(),
  }),
});

export const updateQuizStatusSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    is_active: z.boolean({ message: 'is_active status is required' }),
  }),
});

export const getQuizSubmissionsSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
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
