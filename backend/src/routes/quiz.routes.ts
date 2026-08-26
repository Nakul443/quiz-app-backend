import { Router, Request, Response } from 'express';

const router = Router();

// POST /quizzes - [admin] create quiz
router.post('/', (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Create quiz' });
});

// GET /quizzes - [admin: all, user: active only]
router.get('/', (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Get quizzes' });
});

// GET /quizzes/:id - [both] quiz detail (user view excludes correct answers)
router.get('/:id', (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: `Get quiz detail with id: ${req.params.id}` });
});

// PATCH /quizzes/:id - [admin] update title/description/time_limit
router.patch('/:id', (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: `Update quiz with id: ${req.params.id}` });
});

// PATCH /quizzes/:id/status - [admin] activate/deactivate (blocked if 0 questions)
router.patch('/:id/status', (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: `Update quiz status for id: ${req.params.id}` });
});

// DELETE /quizzes/:id - [admin] soft delete (blocked/handled if submissions exist)
router.delete('/:id', (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: `Delete quiz for id: ${req.params.id}` });
});

// GET /quizzes/:id/submissions - [admin] all attempts for this quiz
router.get('/:id/submissions', (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: `Get submissions for quiz id: ${req.params.id}` });
});

export default router;