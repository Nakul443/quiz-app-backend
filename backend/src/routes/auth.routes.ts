import { Router, Request, Response } from 'express';

const router = Router();

// POST /auth/register
router.post('/register', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Register stub' });
});

// POST /auth/login
router.post('/login', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Login for auth' });
});

export default router;