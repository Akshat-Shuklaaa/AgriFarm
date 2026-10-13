import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/response';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('[Error Handler]', err);

  if (err instanceof ZodError) {
    const errorMessages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    return sendError(res, `Validation Error: ${errorMessages}`, 400, err.errors);
  }

  const statusCode = err.statusCode || (err.status && typeof err.status === 'number' ? err.status : 500);
  const message = err.message || 'Internal Server Error';

  return sendError(res, message, statusCode);
}
