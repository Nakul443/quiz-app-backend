import { Quiz, IQuiz } from '../models/quiz.model';
import { Question } from '../models/question.model';
import { Option } from '../models/option.model';
import { Attempt } from '../models/attempt.model';
import { ApiError } from '../utils/apiError';
import { Types } from 'mongoose';

export class QuizService {
  static async createQuiz(title: string, description: string, time_limit: number, createdBy: string) {
    const quiz = new Quiz({
      title,
      description,
      time_limit,
      created_by: new Types.ObjectId(createdBy),
      is_active: false,
      is_deleted: false,
    });
    return await quiz.save();
  }

  static async getQuizzes(role: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const filter: any = { is_deleted: false };

    if (role !== 'admin') {
      filter.is_active = true;
    }

    const [quizzes, total] = await Promise.all([
      Quiz.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('created_by', 'name email'),
      Quiz.countDocuments(filter),
    ]);

    return {
      quizzes,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  static async getQuizDetail(quizId: string, role: string) {
    const quiz = await Quiz.findOne({ _id: quizId, is_deleted: false });
    if (!quiz) {
      throw new ApiError(404, 'Quiz not found.');
    }

    if (role !== 'admin' && !quiz.is_active) {
      throw new ApiError(403, 'This quiz is not currently active.');
    }

    // Fetch questions and options
    const questions = await Question.find({ quiz_id: quizId }).sort({ order_index: 1 });
    const questionIds = questions.map((q) => q._id);
    const options = await Option.find({ question_id: { $in: questionIds } }).sort({ order_index: 1 });

    // Format detail response
    const questionsWithOptions = questions.map((q) => {
      const qOptions = options
        .filter((o) => o.question_id.toString() === q._id.toString())
        .map((o) => {
          const opt = o.toJSON() as any;
          if (role !== 'admin') {
            delete opt.is_correct; // Strip correct answers for users
          }
          return opt;
        });

      return {
        ...q.toJSON(),
        options: qOptions,
      };
    });

    return {
      quiz,
      questions: questionsWithOptions,
    };
  }

  static async updateQuiz(quizId: string, updates: Partial<Pick<IQuiz, 'title' | 'description' | 'time_limit'>>) {
    const quiz = await Quiz.findOne({ _id: quizId, is_deleted: false });
    if (!quiz) {
      throw new ApiError(404, 'Quiz not found.');
    }

    if (updates.title !== undefined) quiz.title = updates.title;
    if (updates.description !== undefined) quiz.description = updates.description;
    if (updates.time_limit !== undefined) quiz.time_limit = updates.time_limit;

    return await quiz.save();
  }

  static async updateQuizStatus(quizId: string, is_active: boolean) {
    const quiz = await Quiz.findOne({ _id: quizId, is_deleted: false });
    if (!quiz) {
      throw new ApiError(404, 'Quiz not found.');
    }

    if (is_active) {
      // Check if quiz has >= 1 question
      const questionCount = await Question.countDocuments({ quiz_id: quizId });
      if (questionCount === 0) {
        throw new ApiError(400, 'Cannot activate an empty quiz. Please add at least one question.');
      }
    }

    quiz.is_active = is_active;
    return await quiz.save();
  }

  static async softDeleteQuiz(quizId: string) {
    const quiz = await Quiz.findOne({ _id: quizId, is_deleted: false });
    if (!quiz) {
      throw new ApiError(404, 'Quiz not found.');
    }

    // Mark as soft deleted
    quiz.is_deleted = true;
    quiz.is_active = false;
    await quiz.save();

    return quiz;
  }

  static async getSubmissions(quizId: string, page: number = 1, limit: number = 10) {
    const quiz = await Quiz.findOne({ _id: quizId, is_deleted: false });
    if (!quiz) {
      throw new ApiError(404, 'Quiz not found.');
    }

    const skip = (page - 1) * limit;
    const [attempts, total] = await Promise.all([
      Attempt.find({ quiz_id: quizId })
        .sort({ started_at: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user_id', 'name email'),
      Attempt.countDocuments({ quiz_id: quizId }),
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
}
