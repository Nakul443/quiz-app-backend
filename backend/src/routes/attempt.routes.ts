import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { ROLES } from '../constants/roles';

const router = Router();

// Apply authentication and authorization for user to all attempt routes
router.use(authenticate, authorize(ROLES.USER));

// GET /attempts - logged-in user's attempt history
router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Get attempts history' });
});

// GET /attempts/:id - resume/get current state incl. time remaining
router.get('/:id', (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: `Get attempt state for id: ${req.params.id}` });
});

// PATCH /attempts/:id/answers - submit answer for one question
router.patch('/:id/answers', (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: `Submit answer for attempt id: ${req.params.id}` });
});

// POST /attempts/:id/submit - final submit — computes score
router.post('/:id/submit', (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: `Final submit for attempt id: ${req.params.id}` });
});

// GET /attempts/:id/result - detailed result breakdown
router.get('/:id/result', (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: `Get result for attempt id: ${req.params.id}` });
});

export default router;