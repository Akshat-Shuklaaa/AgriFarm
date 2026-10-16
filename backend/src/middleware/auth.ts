import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { sendError } from '../utils/response';
import { authService, SafeUser } from '../services/authService';
import { auditService } from '../services/auditService';
import { Role, Resource, Action, hasPermission } from '../config/permissions';

export interface AuthContext {
  id: string;
  name: string;
  email: string;
  role: Role;
  sessionId: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthContext;
  fullUser?: SafeUser;
}

/**
 * Middleware: Verify active session from HttpOnly cookie or Authorization Bearer header.
 * Validates against the Redis session store to support instant revocation.
 */
export const authenticateSession = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookieToken = req.cookies?.token || req.cookies?.session_token;
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    const token = cookieToken || bearerToken;
    const isCookieAuth = Boolean(cookieToken && !bearerToken);

    if (!token) {
      return sendError(res, 'Authentication required: please log in', 401);
    }

    // 1. Verify JWT signature
    let decoded: any;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (err: any) {
      return sendError(res, 'Session token invalid or expired. Please sign in again.', 401);
    }

    if (!decoded.sessionId || !decoded.id) {
      return sendError(res, 'Malformed session token', 401);
    }

    // 2. Verify session exists in Redis (for instant revocation upon logout or account deactivation)
    const session = await authService.getSession(decoded.sessionId);
    if (!session) {
      // Clear invalid cookie
      res.clearCookie('token');
      res.clearCookie('session_token');
      return sendError(res, 'Session has expired or was revoked. Please log in again.', 401);
    }

    // 3. Verify user account status
    const user = await authService.getUserById(session.userId);
    if (!user) {
      return sendError(res, 'User account no longer exists', 401);
    }

    if (user.status === 'inactive') {
      res.clearCookie('token');
      res.clearCookie('session_token');
      return sendError(res, 'Account is inactive. Please contact your system administrator.', 403);
    }

    // 4. CSRF protection on mutating HTTP methods for cookie-based browser sessions
    const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (isCookieAuth && mutatingMethods.includes(req.method.toUpperCase())) {
      const csrfHeader = (req.headers['x-csrf-token'] || req.headers['x-requested-with']) as string;
      const isValidCsrf =
        csrfHeader === session.csrfToken ||
        csrfHeader === 'XMLHttpRequest' ||
        req.headers['sec-fetch-site'] === 'same-origin';

      if (!isValidCsrf) {
        return sendError(res, 'Cross-Site Request Forgery (CSRF) validation failed', 403);
      }
    }

    // Attach validated auth context
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      sessionId: session.sessionId,
    };
    req.fullUser = user;

    next();
  } catch (error: any) {
    console.error('[AuthMiddleware] Error:', error);
    return sendError(res, 'Internal authentication verification error', 500);
  }
};

/**
 * Middleware: Enforce Role-Based Access Control (RBAC) permission on a specific resource & action.
 */
export const requirePermission = (resource: Resource, action: Action) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    const permitted = hasPermission(req.user.role, resource, action);
    if (!permitted) {
      return sendError(
        res,
        `Forbidden: Role '${req.user.role}' lacks '${action}' permission on '${resource}'`,
        403
      );
    }

    next();
  };
};

/**
 * Middleware: Restrict access to specific roles (e.g. Admin only)
 */
export const requireRole = (allowedRoles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Forbidden: Insufficient privileges. Required: ${allowedRoles.join(', ')}`,
        403
      );
    }

    next();
  };
};

/**
 * Optional authentication: attach user if valid token present, otherwise continue as guest.
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token =
      req.cookies?.token ||
      req.cookies?.session_token ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null);

    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret) as any;
      if (decoded?.sessionId) {
        const session = await authService.getSession(decoded.sessionId);
        if (session) {
          const user = await authService.getUserById(session.userId);
          if (user && user.status === 'active') {
            req.user = {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              sessionId: session.sessionId,
            };
            req.fullUser = user;
          }
        }
      }
    }
  } catch {
    // Ignore invalid/expired tokens for optional auth
  }
  next();
};

/**
 * Route-level guard that maps HTTP method to Action and verifies role permission on the resource.
 */
export const authorizeEntity = (resource: Resource) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    let action: Action = 'read';
    const method = req.method.toUpperCase();
    if (method === 'POST') action = 'create';
    else if (method === 'PUT' || method === 'PATCH') action = 'update';
    else if (method === 'DELETE') action = 'delete';
    else if (method === 'GET') action = 'read';

    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    if (!hasPermission(req.user.role, resource, action)) {
      return sendError(
        res,
        `Forbidden: Role '${req.user.role}' lacks '${action}' permission on '${resource}'`,
        403
      );
    }

    // Automatically record audit log on successful mutating operations
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      res.on('finish', () => {
        if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
          const auditAction =
            method === 'DELETE'
              ? `${resource.toUpperCase()}_DELETE`
              : method === 'POST'
              ? `${resource.toUpperCase()}_CREATE`
              : `${resource.toUpperCase()}_UPDATE`;
          const entityId = req.params?.id || '';
          auditService.log({
            userId: req.user.id,
            username: req.user.name,
            userRole: req.user.role,
            action: auditAction,
            entityType: resource,
            entityId,
            details: {
              method,
              url: req.originalUrl,
            },
            ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
          });
        }
      });
    }

    next();
  };
};
