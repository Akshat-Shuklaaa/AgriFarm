import { Router, Response } from 'express';
import { authService } from '../services/authService';
import {
  authenticateSession,
  requireRole,
  AuthenticatedRequest,
} from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import {
  createUserSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  paginationQuerySchema,
} from '../validation/schemas';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

// All user management routes require active Admin privileges
router.use(authenticateSession, requireRole(['admin']));

/**
 * GET /api/users
 * Paginated user listing
 */
router.get('/', validateQuery(paginationQuerySchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page, limit, search, role, status } = req.query as any;
    const result = await authService.listUsers({
      page,
      limit,
      search,
      role,
      status,
    });
    return sendSuccess(res, result.data, 200, {
      page: result.page,
      limit: result.limit,
      total: result.total,
    });
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
});

/**
 * POST /api/users
 * Create a new user account with assigned role
 */
router.post('/', validateBody(createUserSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const newUser = await authService.createUser({
      ...req.body,
      actor: {
        id: req.user!.id,
        name: req.user!.name,
        role: req.user!.role,
      },
    });
    return sendSuccess(res, newUser, 201);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
});

/**
 * GET /api/users/:id
 * Retrieve user by ID
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await authService.getUserById(req.params.id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }
    return sendSuccess(res, user);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
});

/**
 * PATCH /api/users/:id/role
 * Update user's assigned role
 */
router.patch(
  '/:id/role',
  validateBody(updateUserRoleSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const updatedUser = await authService.updateUserRole(
        req.params.id,
        req.body.role,
        {
          id: req.user!.id,
          name: req.user!.name,
          role: req.user!.role,
        }
      );
      return sendSuccess(res, updatedUser);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }
);

/**
 * PATCH /api/users/:id/status
 * Activate or deactivate user account
 */
router.patch(
  '/:id/status',
  validateBody(updateUserStatusSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const updatedUser = await authService.updateUserStatus(
        req.params.id,
        req.body.status,
        {
          id: req.user!.id,
          name: req.user!.name,
          role: req.user!.role,
        }
      );
      return sendSuccess(res, updatedUser);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }
);

/**
 * DELETE /api/users/:id
 * Delete user account and revoke all sessions
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await authService.deleteUser(req.params.id, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.role,
    });
    return sendSuccess(res, { message: 'User deleted successfully' });
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
});

export default router;
