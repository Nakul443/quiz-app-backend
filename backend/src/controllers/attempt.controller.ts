import { Request, Response } from 'express';
import { AttemptService } from '../services/attempt.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendResponse } from '../utils/apiResponse';

export const startAttempt = asyncHandler(async (req: Request, res: Response) => {
  const quizId = req.params.id as string;
  const userId = req.user!.id;

  const attempt = await AttemptService.startAttempt(userId, quizId);
  sendResponse(res, 201, true, 'Quiz attempt started successfully.', attempt);
});

export const getAttemptState = asyncHandler(async (req: Request, res: Response) => {
  const attemptId = req.params.id as string;
  const userId = req.user!.id;

  const attemptState = await AttemptService.getAttemptState(userId, attemptId);
  sendResponse(res, 200, true, 'Attempt state retrieved successfully.', attemptState);
});

export const submitAnswer = asyncHandler(async (req: Request, res: Response) => {
  const attemptId = req.params.id as string;
  const userId = req.user!.id;
  const { question_id, selected_option_id } = req.body;

  if (!question_id || selected_option_id === undefined) {
    res.status(400).json({
      success: false,
      message: 'Question id and selected option id (or null) are required.',
    });
    return;
  }

  const answerResponse = await AttemptService.submitAnswer(
    userId,
    attemptId,
    question_id,
    selected_option_id
  );

  sendResponse(res, 200, true, 'Answer submitted successfully.', answerResponse);
});

export const finalSubmit = asyncHandler(async (req: Request, res: Response) => {
  const attemptId = req.params.id as string;
  const userId = req.user!.id;

  const result = await AttemptService.finalSubmit(userId, attemptId);
  sendResponse(res, 200, true, 'Attempt submitted successfully.', result);
});

export const getAttemptsHistory = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;

  const history = await AttemptService.getAttemptsHistory(userId, page, limit);
  sendResponse(res, 200, true, 'Attempts history retrieved successfully.', history);
});

export const getAttemptResult = asyncHandler(async (req: Request, res: Response) => {
  const attemptId = req.params.id as string;
  const userId = req.user!.id;

  const resultBreakdown = await AttemptService.getAttemptResult(userId, attemptId);
  sendResponse(res, 200, true, 'Attempt result breakdown retrieved successfully.', resultBreakdown);
});
