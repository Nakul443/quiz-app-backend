import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { ROLES } from '../constants/roles';
import { validate } from '../middlewares/validate.middleware';
import {
  getAttemptsHistorySchema,
  attemptIdParamsSchema,
  submitAnswerSchema,
} from '../validators/attempt.validator';
import {
  getAttemptsHistory,
  getAttemptState,
  submitAnswer,
  finalSubmit,
  getAttemptResult,
} from '../controllers/attempt.controller';

const router = Router();

// Apply authentication and authorization for user to all attempt routes
router.use(authenticate, authorize(ROLES.USER));

// GET /attempts - logged-in user's attempt history
router.get('/', validate(getAttemptsHistorySchema), getAttemptsHistory);

// GET /attempts/:id - resume/get current state incl. time remaining
router.get('/:id', validate(attemptIdParamsSchema), getAttemptState);

// PATCH /attempts/:id/answers - submit answer for one question
router.patch('/:id/answers', validate(submitAnswerSchema), submitAnswer);

// POST /attempts/:id/submit - final submit — computes score
router.post('/:id/submit', validate(attemptIdParamsSchema), finalSubmit);

// GET /attempts/:id/result - detailed result breakdown
router.get('/:id/result', validate(attemptIdParamsSchema), getAttemptResult);

export default router;