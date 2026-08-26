import { Router, Request, Response } from 'express';

// Enable mergeParams to access :id (quiz_id) from the parent router
const router = Router({ mergeParams: true });

// POST /quizzes/:id/questions - [admin only] create question
router.post('/', (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: `Create question for quiz id: ${req.params.id}` });
});

// GET /quizzes/:id/questions - [admin only] get all questions for quiz
router.get('/', (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: `Get questions for quiz id: ${req.params.id}` });
});

// PATCH /quizzes/:id/questions/:qid - [admin only] update question
router.patch('/:qid', (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: `Update question for qid: ${req.params.qid} on quiz id: ${req.params.id}` });
});

// DELETE /quizzes/:id/questions/:qid - [admin only] delete question
router.delete('/:qid', (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: `Delete question for qid: ${req.params.qid} on quiz id: ${req.params.id}` });
});

export default router;
