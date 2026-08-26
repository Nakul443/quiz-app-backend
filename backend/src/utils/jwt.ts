// sign/verify jwt logic in one place

import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface TokenPayload {
  user_id: string;
  role: string;
}

export const signToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '24h' });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
};