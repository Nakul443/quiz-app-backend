import { Schema, model, Document } from 'mongoose';
import { ROLES } from '../constants/roles';

export interface IUser extends Document {
  name: string;
  email: string;
  password_hash: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    password_hash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: ROLES.USER,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete (ret as any).password_hash;
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

export const User = model<IUser>('User', userSchema);