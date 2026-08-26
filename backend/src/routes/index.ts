import { Router } from 'express';
import authRoutes from './auth.routes';
import quizRoutes from './quiz.routes';
import questionRoutes from './question.routes';
import attemptRoutes from './attempt.routes';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { ROLES } from '../constants/roles';
import { validate } from '../middlewares/validate.middleware';
import { startAttemptSchema } from '../validators/attempt.validator';
import { startAttempt } from '../controllers/attempt.controller';

const router = Router();

// Auth routes
router.use('/auth', authRoutes);

// Questions routes nested under quizzes
router.use('/quizzes/:id/questions', questionRoutes);

// Quiz attempts nested under quizzes
// to start a brand new attempt
// initially we don't have an attempt ID, so we need to create a new attempt for the quiz
router.post('/quizzes/:id/attempts', authenticate, authorize(ROLES.USER), validate(startAttemptSchema), startAttempt);

// Quiz routes
router.use('/quizzes', quizRoutes);

// Attempt routes
// to interact with existing attempts, we need the attempt ID, so we use the attempt routes
router.use('/attempts', attemptRoutes);

export default router;