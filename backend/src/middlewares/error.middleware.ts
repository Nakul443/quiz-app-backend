import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors: any[] = [];

  // Log full error stack in non-production environments
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error caught in middleware:', err);
  } else {
    console.error(`[Error] ${statusCode} - ${message}`);
  }

  // Handle Mongoose / MongoDB validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    errors = Object.values(err.errors).map((error: any) => ({
      field: error.path,
      message: error.message,
    }));
  }

  // Handle MongoDB duplicate key errors (11000)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate field value entered. The ${field} must be unique.`;
  }

  // Handle Mongoose cast errors (e.g. invalid ObjectId query)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Resource not found. Invalid formatted ID: ${err.value}`;
  }

  // Handle JWT verification errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Access denied.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired. Please authenticate again.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors.length > 0 && { errors }),
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
