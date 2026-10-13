import { Router, Request, Response } from 'express';
import { paymentService } from '../services/salesServices';
import { validateBody, validateQuery } from '../middleware/validate';
import {
  createPaymentSchema,
  updatePaymentSchema,
  paginationQuerySchema,
} from '../validation/schemas';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

router.get('/', validateQuery(paginationQuerySchema), async (req: Request, res: Response) => {
  try {
    const { page, limit, search, sortBy, sortOrder, ...filters } = req.query as any;
    const result = await paymentService.getAll({
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      filter: filters,
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

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const item = await paymentService.getById(req.params.id);
    if (!item) {
      return sendError(res, 'Payment not found', 404);
    }
    return sendSuccess(res, item);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
});

router.post('/', validateBody(createPaymentSchema), async (req: Request, res: Response) => {
  try {
    const item = await paymentService.create(req.body);
    return sendSuccess(res, item, 201);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
});

router.put('/:id', validateBody(updatePaymentSchema), async (req: Request, res: Response) => {
  try {
    const item = await paymentService.update(req.params.id, req.body);
    if (!item) {
      return sendError(res, 'Payment not found', 404);
    }
    return sendSuccess(res, item);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await paymentService.delete(req.params.id);
    if (!result.success) {
      return sendError(res, result.error || 'Failed to delete payment', 400);
    }
    return sendSuccess(res, { message: 'Payment deleted successfully' });
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
});

export default router;
