import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError } from 'zod';
import { sendError } from '../utils/response';

export const validateBody = (schema: ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return sendError(res, 'Validation failed: ' + error.errors.map((e) => e.message).join('; '), 400, details);
      }
      next(error);
    }
  };
};

export const validateQuery = (schema: ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = (await schema.parseAsync(req.query)) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return sendError(res, 'Invalid query parameters: ' + error.errors.map((e) => e.message).join('; '), 400, error.errors);
      }
      next(error);
    }
  };
};

export const validateParams = (schema: ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = (await schema.parseAsync(req.params)) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return sendError(res, 'Invalid route parameters: ' + error.errors.map((e) => e.message).join('; '), 400, error.errors);
      }
      next(error);
    }
  };
};
