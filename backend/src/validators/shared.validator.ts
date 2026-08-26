// this file creates a shared validator for common validation logic that can be reused across different validators

import { z } from 'zod';
import { Types } from 'mongoose';

// Helper to validate Mongoose ObjectIds
export const objectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: 'Invalid Mongo ObjectId format',
});
