import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { ROLES } from '../constants/roles';
import { validate } from '../middlewares/validate.middleware';
import {
  createQuizSchema,
  getQuizzesSchema,
  quizIdParamsSchema,
  updateQuizSchema,
  updateQuizStatusSchema,
  getQuizSubmissionsSchema,
} from '../validators/quiz.validator';
import {
  createQuiz,
  getQuizzes,
  getQuizDetail,
  updateQuiz,
  updateQuizStatus,
  deleteQuiz,
  getQuizSubmissions,
} from '../controllers/quiz.controller';

const router = Router();

// POST /quizzes - [admin] create quiz
router.post('/', authenticate, authorize(ROLES.ADMIN), validate(createQuizSchema), createQuiz);

// GET /quizzes - [admin: all, user: active only]
router.get('/', authenticate, authorize(ROLES.ADMIN, ROLES.USER), validate(getQuizzesSchema), getQuizzes);

// GET /quizzes/:id - [both] quiz detail (user view excludes correct answers)
router.get('/:id', authenticate, authorize(ROLES.ADMIN, ROLES.USER), validate(quizIdParamsSchema), getQuizDetail);

// PATCH /quizzes/:id - [admin] update title/description/time_limit
router.patch('/:id', authenticate, authorize(ROLES.ADMIN), validate(updateQuizSchema), updateQuiz);

// PATCH /quizzes/:id/status - [admin] activate/deactivate (blocked if 0 questions)
router.patch('/:id/status', authenticate, authorize(ROLES.ADMIN), validate(updateQuizStatusSchema), updateQuizStatus);

// DELETE /quizzes/:id - [admin] soft delete (blocked/handled if submissions exist)
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), validate(quizIdParamsSchema), deleteQuiz);

// GET /quizzes/:id/submissions - [admin] all attempts for this quiz
router.get('/:id/submissions', authenticate, authorize(ROLES.ADMIN), validate(getQuizSubmissionsSchema), getQuizSubmissions);

export default router;