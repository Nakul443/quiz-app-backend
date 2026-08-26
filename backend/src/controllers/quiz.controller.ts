import { Request, Response } from 'express';
import { QuizService } from '../services/quiz.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendResponse } from '../utils/apiResponse';

export const createQuiz = asyncHandler(async (req: Request, res: Response) => {
  const { title, description, time_limit } = req.body;
  const adminId = req.user!.id;

  if (!title || !description || time_limit === undefined) {
    res.status(400).json({ success: false, message: 'Title, description and time limit are required.' });
    return;
  }

  const quiz = await QuizService.createQuiz(title, description, time_limit, adminId);
  sendResponse(res, 201, true, 'Quiz created successfully.', quiz);
});

export const getQuizzes = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const role = req.user!.role;

  const result = await QuizService.getQuizzes(role, page, limit);
  sendResponse(res, 200, true, 'Quizzes retrieved successfully.', result);
});

export const getQuizDetail = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const role = req.user!.role;

  const result = await QuizService.getQuizDetail(id, role);
  sendResponse(res, 200, true, 'Quiz details retrieved successfully.', result);
});

export const updateQuiz = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { title, description, time_limit } = req.body;

  const updatedQuiz = await QuizService.updateQuiz(id, { title, description, time_limit });
  sendResponse(res, 200, true, 'Quiz updated successfully.', updatedQuiz);
});

export const updateQuizStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { is_active } = req.body;

  if (is_active === undefined) {
    res.status(400).json({ success: false, message: 'Status is_active is required.' });
    return;
  }

  const updatedQuiz = await QuizService.updateQuizStatus(id, is_active);
  sendResponse(res, 200, true, `Quiz ${is_active ? 'activated' : 'deactivated'} successfully.`, updatedQuiz);
});

export const deleteQuiz = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const deletedQuiz = await QuizService.softDeleteQuiz(id);
  sendResponse(res, 200, true, 'Quiz deleted successfully (soft delete).', deletedQuiz);
});

export const getQuizSubmissions = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;

  const result = await QuizService.getSubmissions(id, page, limit);
  sendResponse(res, 200, true, 'Quiz submissions retrieved successfully.', result);
});
