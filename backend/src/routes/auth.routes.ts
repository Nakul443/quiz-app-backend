import { Router, Request, Response } from 'express';

const router = Router();

// POST /auth/register
router.post('/register', (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Register for auth' });
});

// POST /auth/login
router.post('/login', (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Login for auth' });
});

export default router;