import { Question } from '../models/question.model';
import { Option } from '../models/option.model';
import { Quiz } from '../models/quiz.model';
import { ApiError } from '../utils/apiError';
import { Types } from 'mongoose';

export interface ICreateOptionInput {
  option_text: string;
  is_correct: boolean;
  order_index: number;
}

export class QuestionService {
  static async createQuestion(
    quizId: string,
    questionText: string,
    questionType: string,
    orderIndex: number,
    points: number,
    options: ICreateOptionInput[]
  ) {
    // Check if quiz exists
    const quiz = await Quiz.findOne({ _id: quizId, is_deleted: false });
    if (!quiz) {
      throw new ApiError(404, 'Quiz not found.');
    }

    // App-enforced option validations
    if (!options || options.length < 2) {
      throw new ApiError(400, 'A question must have at least 2 options.');
    }

    const correctOptions = options.filter((opt) => opt.is_correct === true);
    if (correctOptions.length !== 1) {
      throw new ApiError(400, 'A question must have exactly one correct option.');
    }

    // Create the question
    const question = new Question({
      quiz_id: new Types.ObjectId(quizId),
      question_text: questionText,
      question_type: questionType || 'mcq',
      order_index: orderIndex,
      points: points !== undefined ? points : 1,
    });

    const savedQuestion = await question.save();

    // Create the options
    const optionDocs = options.map((opt) => ({
      question_id: savedQuestion._id,
      option_text: opt.option_text,
      is_correct: opt.is_correct,
      order_index: opt.order_index,
    }));

    const savedOptions = await Option.insertMany(optionDocs);

    return {
      ...savedQuestion.toJSON(),
      options: savedOptions,
    };
  }

  static async getQuestionsForQuiz(quizId: string) {
    // Check if quiz exists
    const quiz = await Quiz.findOne({ _id: quizId, is_deleted: false });
    if (!quiz) {
      throw new ApiError(404, 'Quiz not found.');
    }

    const questions = await Question.find({ quiz_id: quizId }).sort({ order_index: 1 });
    const questionIds = questions.map((q) => q._id);
    const options = await Option.find({ question_id: { $in: questionIds } }).sort({ order_index: 1 });

    return questions.map((q) => {
      const qOptions = options.filter((o) => o.question_id.toString() === q._id.toString());
      return {
        ...q.toJSON(),
        options: qOptions,
      };
    });
  }

  static async updateQuestion(
    quizId: string,
    questionId: string,
    updates: {
      question_text?: string;
      question_type?: string;
      order_index?: number;
      points?: number;
      options?: ICreateOptionInput[];
    }
  ) {
    // Check if quiz exists
    const quiz = await Quiz.findOne({ _id: quizId, is_deleted: false });
    if (!quiz) {
      throw new ApiError(404, 'Quiz not found.');
    }

    const question = await Question.findOne({ _id: questionId, quiz_id: quizId });
    if (!question) {
      throw new ApiError(404, 'Question not found on this quiz.');
    }

    // Apply basic field updates
    if (updates.question_text !== undefined) question.question_text = updates.question_text;
    if (updates.question_type !== undefined) question.question_type = updates.question_type;
    if (updates.order_index !== undefined) question.order_index = updates.order_index;
    if (updates.points !== undefined) question.points = updates.points;

    const savedQuestion = await question.save();

    // Apply options updates if provided
    let updatedOptions = [];
    if (updates.options !== undefined) {
      const options = updates.options;
      if (options.length < 2) {
        throw new ApiError(400, 'A question must have at least 2 options.');
      }

      const correctOptions = options.filter((opt) => opt.is_correct === true);
      if (correctOptions.length !== 1) {
        throw new ApiError(400, 'A question must have exactly one correct option.');
      }

      // Delete old options
      await Option.deleteMany({ question_id: questionId });

      // Insert new options
      const optionDocs = options.map((opt) => ({
        question_id: savedQuestion._id,
        option_text: opt.option_text,
        is_correct: opt.is_correct,
        order_index: opt.order_index,
      }));

      updatedOptions = await Option.insertMany(optionDocs);
    } else {
      updatedOptions = await Option.find({ question_id: questionId }).sort({ order_index: 1 });
    }

    return {
      ...savedQuestion.toJSON(),
      options: updatedOptions,
    };
  }

  static async deleteQuestion(quizId: string, questionId: string) {
    // Check if quiz exists
    const quiz = await Quiz.findOne({ _id: quizId, is_deleted: false });
    if (!quiz) {
      throw new ApiError(404, 'Quiz not found.');
    }

    const question = await Question.findOneAndDelete({ _id: questionId, quiz_id: quizId });
    if (!question) {
      throw new ApiError(404, 'Question not found on this quiz.');
    }

    // Delete associated options
    await Option.deleteMany({ question_id: questionId });

    return question;
  }
}
