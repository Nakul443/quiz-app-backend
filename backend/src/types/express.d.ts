// interfaces/types shared across files (e.g., what a JWT payload looks like, what req.user looks like)

import { Role } from '../constants/roles';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}
