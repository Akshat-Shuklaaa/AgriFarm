import { Router, Response } from 'express';
import { auditService } from '../services/auditService';
import {
  authenticateSession,
  requireRole,
  AuthenticatedRequest,
} from '../middleware/auth';
import { validateQuery } from '../middleware/validate';
import { paginationQuerySchema } from '../validation/schemas';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

// Audit logs are restricted to Admin
router.use(authenticateSession, requireRole(['admin']));

/**
 * GET /api/audit-logs
 * Paginated security audit trail
 */
router.get('/', validateQuery(paginationQuerySchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page, limit, action, entityType } = req.query as any;
    const result = await auditService.getLogs({
      page,
      limit,
      action,
      entityType,
    });
    return sendSuccess(res, result.data, 200, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
});

export default router;
