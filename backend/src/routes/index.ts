import { Router } from 'express';
import authRoutes from './auth.routes';
import quizRoutes from './quiz.routes';
import questionRoutes from './question.routes';
import attemptRoutes from './attempt.routes';

const router = Router();

// Auth routes
router.use('/auth', authRoutes);

// Questions routes nested under quizzes
router.use('/quizzes/:id/questions', questionRoutes);

// Quiz attempts nested under quizzes
// to start a brand new attempt
// initially we don't have an attempt ID, so we need to create a new attempt for the quiz
router.post('/quizzes/:id/attempts', (req, res) => {
  res.status(200).json({ success: true, message: `Start attempt for quiz id: ${req.params.id}` });
});

// Quiz routes
router.use('/quizzes', quizRoutes);

// Attempt routes
// to interact with existing attempts, we need the attempt ID, so we use the attempt routes
router.use('/attempts', attemptRoutes);

export default router;