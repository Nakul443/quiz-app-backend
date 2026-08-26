import { Attempt, IAttempt } from '../models/attempt.model';
import { Quiz } from '../models/quiz.model';
import { Question } from '../models/question.model';
import { Option } from '../models/option.model';
import { AnswerResponse } from '../models/answerResponse.model';
import { ATTEMPT_STATUS } from '../constants/attemptStatus';
import { ScoringService } from './scoring.service';
import { ApiError } from '../utils/apiError';
import { Types } from 'mongoose';

export class AttemptService {
  /**
   * Helper to perform a lazy check on timer expiration.
   * If expired, auto-submits the attempt.
   */
  static async lazyCheckExpiration(attemptId: string): Promise<IAttempt> {
    const attempt = await Attempt.findById(attemptId); // retrieve attempt from the database
    if (!attempt) {
      throw new ApiError(404, 'Attempt not found.');
    }

    if (attempt.status !== ATTEMPT_STATUS.IN_PROGRESS) {
      return attempt;
    }

    const quiz = await Quiz.findById(attempt.quiz_id);
    if (!quiz) {
      throw new ApiError(404, 'Quiz associated with this attempt not found.');
    }

    const startTime = attempt.started_at.getTime();
    const timeLimitMs = quiz.time_limit * 1000;
    const now = Date.now();

    if (now > startTime + timeLimitMs) {
      // timer expired, auto-submit the attempt
      return await ScoringService.finalizeAndScore(attemptId, ATTEMPT_STATUS.AUTO_SUBMITTED);
    }

    return attempt;
  }

  static async startAttempt(userId: string, quizId: string) {
    const quiz = await Quiz.findOne({ _id: quizId, is_deleted: false }); // to check that the quiz is not deleted so users cannot start attempts on deleted quizzes
    if (!quiz) {
      throw new ApiError(404, 'Quiz not found.');
    }

    if (!quiz.is_active) {
      throw new ApiError(400, 'Cannot start an attempt on an inactive quiz.');
    }

    const existingAttempt = await Attempt.findOne({ user_id: userId, quiz_id: quizId });
    if (existingAttempt) {
      throw new ApiError(400, 'You have already attempted this quiz.');
    }

    // Check if the quiz has any questions
    const total_questions = await Question.countDocuments({ quiz_id: quizId });
    if (total_questions === 0) {
      throw new ApiError(400, 'Cannot start attempt: Quiz has no questions.');
    }

    const attempt = new Attempt({
      quiz_id: new Types.ObjectId(quizId),
      user_id: new Types.ObjectId(userId),
      status: ATTEMPT_STATUS.IN_PROGRESS,
      total_questions,
      started_at: new Date(),
    });

    return await attempt.save();
  }

  static async getAttemptState(userId: string, attemptId: string) {

    // check if the attempt exists and is still in progress or auto-submitted
    let attempt = await this.lazyCheckExpiration(attemptId);

    // check if the user owns this attempt
    if (attempt.user_id.toString() !== userId) {
      throw new ApiError(403, 'Access denied. This is not your attempt.');
    }

    const quiz = await Quiz.findById(attempt.quiz_id);
    if (!quiz) {
      throw new ApiError(404, 'Quiz not found.');
    }

    // Calculate time remaining
    let time_remaining = 0;
    if (attempt.status === ATTEMPT_STATUS.IN_PROGRESS) {
      const startTime = attempt.started_at.getTime();
      const timeLimitMs = quiz.time_limit * 1000;
      const now = Date.now();
      time_remaining = Math.max(0, Math.floor((startTime + timeLimitMs - now) / 1000));
    }

    // Fetch questions and options (hide correct flag for active attempts)
    const questions = await Question.find({ quiz_id: attempt.quiz_id }).sort({ order_index: 1 });
    const questionIds = questions.map((q) => q._id);
    const options = await Option.find({ question_id: { $in: questionIds } }).sort({ order_index: 1 });

    const formattedQuestions = questions.map((q) => {
      const qOptions = options
        .filter((o) => o.question_id.toString() === q._id.toString())
        .map((o) => {
          const opt = o.toJSON() as any;
          delete opt.is_correct; // Security: strictly hide the correct answer flag
          return opt;
        });

      return {
        ...q.toJSON(),
        options: qOptions,
      };
    });

    // Fetch responses given so far
    const responses = await AnswerResponse.find({ attempt_id: attemptId });

    return {
      attempt,
      quiz: {
        title: quiz.title,
        description: quiz.description,
        time_limit: quiz.time_limit,
      },
      time_remaining,
      questions: formattedQuestions,
      responses,
    };
  }

  static async submitAnswer(
    userId: string,
    attemptId: string,
    questionId: string,
    selectedOptionId: string | null
  ) {
    // check if the attempt exists and is still in progress or auto-submitted
    const attempt = await this.lazyCheckExpiration(attemptId);

    // check if the user owns this attempt
    if (attempt.user_id.toString() !== userId) {
      throw new ApiError(403, 'Access denied. This is not your attempt.');
    }

    // check if the attempt is still in progress
    if (attempt.status !== ATTEMPT_STATUS.IN_PROGRESS) {
      throw new ApiError(400, `Cannot submit answer. Attempt is already ${attempt.status}.`);
    }

    // check if the question belongs to the quiz of this attempt
    const question = await Question.findOne({ _id: questionId, quiz_id: attempt.quiz_id });
    if (!question) {
      throw new ApiError(400, 'Question does not belong to this quiz.');
    }

    // check if the option belongs to this question (if selectedOptionId is not null)
    if (selectedOptionId !== null) {
      const option = await Option.findOne({ _id: selectedOptionId, question_id: questionId });
      if (!option) {
        throw new ApiError(400, 'Option does not belong to this question.');
      }
    }

    // save or update answer response
    let response = await AnswerResponse.findOne({ attempt_id: attemptId, question_id: questionId });

    if (response) {
      response.selected_option_id = selectedOptionId ? new Types.ObjectId(selectedOptionId) : null;
    } else {
      response = new AnswerResponse({
        attempt_id: new Types.ObjectId(attemptId),
        question_id: new Types.ObjectId(questionId),
        selected_option_id: selectedOptionId ? new Types.ObjectId(selectedOptionId) : null,
      });
    }

    return await response.save();
  }

  static async finalSubmit(userId: string, attemptId: string) {
    // check if the attempt exists and is still in progress or auto-submitted
    let attempt = await this.lazyCheckExpiration(attemptId);

    // check if the user owns this attempt
    if (attempt.user_id.toString() !== userId) {
      throw new ApiError(403, 'Access denied. This is not your attempt.');
    }

    // check if the attempt is still in progress
    if (attempt.status !== ATTEMPT_STATUS.IN_PROGRESS) {
      throw new ApiError(400, `Cannot submit. Attempt is already ${attempt.status}.`);
    }

    // final score
    return await ScoringService.finalizeAndScore(attemptId, ATTEMPT_STATUS.SUBMITTED);
  }

  static async getAttemptsHistory(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    // Before fetching the history, perform a lazy check on all active attempts to ensure they are up-to-date
    const activeAttempts = await Attempt.find({ user_id: userId, status: ATTEMPT_STATUS.IN_PROGRESS });
    for (const act of activeAttempts) {
      await this.lazyCheckExpiration(act._id.toString());
    }

    const [attempts, total] = await Promise.all([
      Attempt.find({ user_id: userId })
        .sort({ started_at: -1 })
        .skip(skip)
        .limit(limit)
        .populate('quiz_id', 'title description time_limit'),
      Attempt.countDocuments({ user_id: userId }),
    ]);

    return {
      attempts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  static async getAttemptResult(userId: string, attemptId: string) {
    // check if the attempt exists and is completed
    let attempt = await this.lazyCheckExpiration(attemptId);

    // check if the user owns this attempt
    if (attempt.user_id.toString() !== userId) {
      throw new ApiError(403, 'Access denied. This is not your attempt.');
    }

    // check if the attempt is completed (either submitted or auto-submitted)
    if (attempt.status === ATTEMPT_STATUS.IN_PROGRESS) {
      throw new ApiError(400, 'Attempt has not been submitted yet.');
    }

    // fetch details
    const quiz = await Quiz.findById(attempt.quiz_id);
    const questions = await Question.find({ quiz_id: attempt.quiz_id }).sort({ order_index: 1 });
    const questionIds = questions.map((q) => q._id);
    const options = await Option.find({ question_id: { $in: questionIds } }).sort({ order_index: 1 });
    const responses = await AnswerResponse.find({ attempt_id: attemptId });

    const questionsWithResult = questions.map((q) => {
      const qOptions = options.filter((o) => o.question_id.toString() === q._id.toString());
      const response = responses.find((r) => r.question_id.toString() === q._id.toString());

      return {
        ...q.toJSON(),
        options: qOptions,
        user_response: response || null,
      };
    });

    return {
      attempt,
      quiz,
      questions: questionsWithResult,
    };
  }
}