import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendResponse } from '../utils/apiResponse';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    return;
  }

  const { user, token } = await AuthService.register(name, email, password, role);

  sendResponse(res, 201, true, 'User registered successfully.', {
    user,
    token,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, message: 'Email and password are required.' });
    return;
  }

  const { user, token } = await AuthService.login(email, password);

  sendResponse(res, 200, true, 'Logged in successfully.', {
    user,
    token,
  });
});
