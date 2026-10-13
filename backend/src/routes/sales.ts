import { Router, Request, Response } from 'express';
import { saleService } from '../services/salesServices';
import { validateBody, validateQuery } from '../middleware/validate';
import {
  createSaleSchema,
  updateSaleSchema,
  paginationQuerySchema,
} from '../validation/schemas';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

router.get('/', validateQuery(paginationQuerySchema), async (req: Request, res: Response) => {
  try {
    const { page, limit, search, sortBy, sortOrder, ...filters } = req.query as any;
    const result = await saleService.getAll({
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
    const item = await saleService.getById(req.params.id);
    if (!item) {
      return sendError(res, 'Sale not found', 404);
    }
    return sendSuccess(res, item);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
});

router.get('/:id/payments', async (req: Request, res: Response) => {
  try {
    const records = await saleService.getPayments(req.params.id);
    return sendSuccess(res, records);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
});

router.post('/', validateBody(createSaleSchema), async (req: Request, res: Response) => {
  try {
    const item = await saleService.create(req.body);
    return sendSuccess(res, item, 201);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
});

router.put('/:id', validateBody(updateSaleSchema), async (req: Request, res: Response) => {
  try {
    const item = await saleService.update(req.params.id, req.body);
    if (!item) {
      return sendError(res, 'Sale not found', 404);
    }
    return sendSuccess(res, item);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await saleService.delete(req.params.id);
    if (!result.success) {
      return sendError(res, result.error || 'Failed to delete sale', 400);
    }
    return sendSuccess(res, { message: 'Sale deleted successfully' });
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
});

export default router;
