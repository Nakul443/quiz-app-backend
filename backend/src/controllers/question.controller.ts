import { Request, Response } from 'express';
import { QuestionService } from '../services/question.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendResponse } from '../utils/apiResponse';

export const createQuestion = asyncHandler(async (req: Request, res: Response) => {
  const quizId = req.params.id as string;
  const { question_text, question_type, order_index, points, options } = req.body;

  if (!question_text || order_index === undefined || !options) {
    res.status(400).json({
      success: false,
      message: 'Question text, order index, and options are required.',
    });
    return;
  }

  const question = await QuestionService.createQuestion(
    quizId,
    question_text,
    question_type,
    order_index,
    points,
    options
  );

  sendResponse(res, 201, true, 'Question created successfully.', question);
});

export const getQuestions = asyncHandler(async (req: Request, res: Response) => {
  const quizId = req.params.id as string;

  const questions = await QuestionService.getQuestionsForQuiz(quizId);
  sendResponse(res, 200, true, 'Questions retrieved successfully.', questions);
});

export const updateQuestion = asyncHandler(async (req: Request, res: Response) => {
  const quizId = req.params.id as string;
  const questionId = req.params.qid as string;
  const { question_text, question_type, order_index, points, options } = req.body;

  const question = await QuestionService.updateQuestion(quizId, questionId, {
    question_text,
    question_type,
    order_index,
    points,
    options,
  });

  sendResponse(res, 200, true, 'Question updated successfully.', question);
});

export const deleteQuestion = asyncHandler(async (req: Request, res: Response) => {
  const quizId = req.params.id as string;
  const questionId = req.params.qid as string;

  const deletedQuestion = await QuestionService.deleteQuestion(quizId, questionId);
  sendResponse(res, 200, true, 'Question deleted successfully.', deletedQuestion);
});
