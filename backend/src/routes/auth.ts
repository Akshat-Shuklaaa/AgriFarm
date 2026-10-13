import { Router, Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { validateBody } from '../middleware/validate';
import { authRegisterSchema, authLoginSchema } from '../validation/schemas';
import { authenticateJwt, AuthenticatedRequest } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

router.post(
  '/register',
  validateBody(authRegisterSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.register(req.body);
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      });
      return sendSuccess(res, result, 201);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }
);

router.post(
  '/login',
  validateBody(authLoginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.login(req.body);
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      });
      return sendSuccess(res, result);
    } catch (error: any) {
      return sendError(res, error.message, 401);
    }
  }
);

router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('token');
  return sendSuccess(res, { message: 'Logged out successfully' });
});

router.get('/me', authenticateJwt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await authService.getUserById(req.user!.id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }
    return sendSuccess(res, user);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
});

export default router;
