import { Router } from 'express';
import { register, login } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { registerSchema, loginSchema } from '../validators/auth.validator';

const router = Router();

// POST /auth/register
router.post('/register', validate(registerSchema), register);

// POST /auth/login
router.post('/login', validate(loginSchema), login);

export default router;