// reads process.env once, validates required vars exist (fails at boot if JWT_SECRET or MONGO_URI is missing,
// instead of crashing randomly mid-request later)

import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().transform((val) => parseInt(val, 10)).default(5000),
  MONGO_URI: z.string().url(),
  JWT_SECRET: z.string().min(8),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(' Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;