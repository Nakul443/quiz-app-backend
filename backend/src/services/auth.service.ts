import bcrypt from 'bcrypt';
import { User } from '../models/user.model';
import { ApiError } from '../utils/apiError';
import { signToken } from '../utils/jwt';

export class AuthService {
  static async register(name: string, email: string, password: string, role?: string) {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ApiError(400, 'User with this email already exists.');
    }

    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password_hash,
      role: role || 'user',
    });

    await newUser.save();

    const token = signToken({ user_id: newUser._id.toString(), role: newUser.role });

    return {
      user: newUser,
      token,
    };
  }

  static async login(email: string, password: string) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new ApiError(401, 'Invalid email or password.');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid email or password.');
    }

    const token = signToken({ user_id: user._id.toString(), role: user.role });

    return {
      user,
      token,
    };
  }
}
