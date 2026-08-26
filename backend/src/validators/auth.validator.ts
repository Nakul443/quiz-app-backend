import { z } from 'zod';
import { ROLES } from '../constants/roles';

export const registerSchema = z.object({
  body: z.object({
    name: z
      .string({ message: 'Name is required' })
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must be less than 50 characters'),
    email: z
      .string({ message: 'Email is required' })
      .trim()
      .email('Invalid email address')
      .toLowerCase(),
    password: z
      .string({ message: 'Password is required' })
      .min(6, 'Password must be at least 6 characters')
      .max(100, 'Password must be less than 100 characters'),
    role: z.enum([ROLES.ADMIN, ROLES.USER]).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ message: 'Email is required' })
      .trim()
      .email('Invalid email address')
      .toLowerCase(),
    password: z
      .string({ message: 'Password is required' })
      .min(1, 'Password cannot be empty'),
  }),
});
