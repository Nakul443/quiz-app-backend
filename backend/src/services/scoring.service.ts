import { Attempt } from '../models/attempt.model';
import { Question } from '../models/question.model';
import { Option } from '../models/option.model';
import { AnswerResponse } from '../models/answerResponse.model';
import { ATTEMPT_STATUS } from '../constants/attemptStatus';

export class ScoringService {
  /**
   * Finalizes an attempt, evaluates all answers, computes the final score,
   * updates individual answer correctness, and saves the attempt.
   */
  static async finalizeAndScore(attemptId: string, status: typeof ATTEMPT_STATUS[keyof typeof ATTEMPT_STATUS]) {
    const attempt = await Attempt.findById(attemptId);
    if (!attempt) {
      throw new Error('Attempt not found');
    }

    // Only allow finalization if the attempt is in progress
    if (attempt.status !== ATTEMPT_STATUS.IN_PROGRESS) {
      return attempt;
    }

    // Get all questions for this quiz
    const questions = await Question.find({ quiz_id: attempt.quiz_id });
    const questionIds = questions.map((q) => q._id);

    // Get all options for these questions to check correctness
    const options = await Option.find({ question_id: { $in: questionIds } });

    // Get existing answer responses for this attempt
    const existingResponses = await AnswerResponse.find({ attempt_id: attemptId });

    let finalScore = 0;

    // Process each question to evaluate answers (even those not answered)
    for (const question of questions) {
      const response = existingResponses.find(
        (r) => r.question_id.toString() === question._id.toString()
      );

      let isCorrect = false;
      let selectedOptionId: any = null;

      if (response && response.selected_option_id) {
        selectedOptionId = response.selected_option_id;
        // Find the option
        const option = options.find(
          (o) => o._id.toString() === selectedOptionId.toString() && o.question_id.toString() === question._id.toString()
        );
        if (option && option.is_correct) {
          isCorrect = true;
          finalScore += question.points || 1;
        }

        // Update the existing response's is_correct field
        response.is_correct = isCorrect;
        await response.save();
      } else {
        // If response does not exist, create a skipped/timed-out response
        const newResponse = new AnswerResponse({
          attempt_id: attempt._id,
          question_id: question._id,
          selected_option_id: null,
          is_correct: false,
        });
        await newResponse.save();
      }
    }

    // Update attempt details
    attempt.status = status;
    attempt.score = finalScore;
    attempt.total_questions = questions.length;
    attempt.submitted_at = new Date();

    return await attempt.save();
  }
}
