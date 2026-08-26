import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { ROLES } from '../constants/roles';
import { validate } from '../middlewares/validate.middleware';
import {
  createQuestionSchema,
  getQuestionsSchema,
  updateQuestionSchema,
  deleteQuestionSchema,
} from '../validators/question.validator';
import {
  createQuestion,
  getQuestions,
  updateQuestion,
  deleteQuestion,
} from '../controllers/question.controller';

// Enable mergeParams to access :id (quiz_id) from the parent router
const router = Router({ mergeParams: true });

// Apply authentication and authorization for admin to all nested question routes
router.use(authenticate, authorize(ROLES.ADMIN));

// POST /quizzes/:id/questions - [admin only] create question
router.post('/', validate(createQuestionSchema), createQuestion);

// GET /quizzes/:id/questions - [admin only] get all questions for quiz
router.get('/', validate(getQuestionsSchema), getQuestions);

// PATCH /quizzes/:id/questions/:qid - [admin only] update question
router.patch('/:qid', validate(updateQuestionSchema), updateQuestion);

// DELETE /quizzes/:id/questions/:qid - [admin only] delete question
router.delete('/:qid', validate(deleteQuestionSchema), deleteQuestion);

export default router;
