import { Router, Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { validateBody } from '../middleware/validate';
import { authLoginSchema } from '../validation/schemas';
import { authenticateSession, AuthenticatedRequest } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import { config } from '../config';

const router = Router();

/**
 * Helper to configure secure session cookie
 */
function setSessionCookie(res: Response, token: string) {
  const isProd = config.nodeEnv === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
  });
}

/**
 * POST /api/auth/login
 * Brute-force protected user login with Redis session generation.
 */
router.post(
  '/login',
  validateBody(authLoginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
      const result = await authService.login(req.body, clientIp);

      setSessionCookie(res, result.token);

      return sendSuccess(res, {
        user: result.user,
        token: result.token,
        csrfToken: result.csrfToken,
      });
    } catch (error: any) {
      const isLocked = error.message.includes('locked') || error.message.includes('excessive');
      return sendError(res, error.message, isLocked ? 429 : 401);
    }
  }
);

/**
 * POST /api/auth/logout
 * Invalidate session in Redis and remove browser cookies.
 */
router.post(
  '/logout',
  authenticateSession,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user) {
        await authService.logout(req.user.sessionId, req.user.id);
      }
      res.clearCookie('token', { path: '/' });
      res.clearCookie('session_token', { path: '/' });
      return sendSuccess(res, { message: 'Logged out successfully' });
    } catch (error: any) {
      return sendError(res, error.message, 500);
    }
  }
);

/**
 * GET /api/auth/me
 * Retrieve profile of currently authenticated user.
 */
router.get(
  '/me',
  authenticateSession,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const session = await authService.getSession(req.user!.sessionId);
      return sendSuccess(res, {
        user: req.fullUser,
        csrfToken: session?.csrfToken,
      });
    } catch (error: any) {
      return sendError(res, error.message, 500);
    }
  }
);

/**
 * GET /api/auth/csrf-token
 * Fetch fresh CSRF token for the current session.
 */
router.get(
  '/csrf-token',
  authenticateSession,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const session = await authService.getSession(req.user!.sessionId);
      if (!session) {
        return sendError(res, 'Session not found', 404);
      }
      return sendSuccess(res, { csrfToken: session.csrfToken });
    } catch (error: any) {
      return sendError(res, error.message, 500);
    }
  }
);

export default router;
