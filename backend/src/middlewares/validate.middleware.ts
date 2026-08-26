// file to  
// accepts a zod schema and returns a middleware function that validates the request body, query, and params against the schema

import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

export const validate = (schema: z.ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = (await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      })) as any;

      // Assign sanitized/parsed data back to the request
      req.body = parsed.body;
      req.query = parsed.query;
      req.params = parsed.params;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((issue) => {
          // Remove the top-level 'body', 'query', or 'params' prefix for a cleaner field path
          const path = issue.path.slice(1).join('.');
          return {
            field: path || issue.path[0] || 'unknown',
            message: issue.message,
          };
        });

        res.status(400).json({
          success: false,
          message: 'Validation failed.',
          errors: formattedErrors,
        });
        return;
      }
      next(error);
    }
  };
};