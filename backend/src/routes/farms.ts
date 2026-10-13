import { Router, Request, Response } from 'express';
import { farmService } from '../services/farmServices';
import { validateBody, validateQuery } from '../middleware/validate';
import {
  createFarmSchema,
  updateFarmSchema,
  paginationQuerySchema,
} from '../validation/schemas';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

router.get('/', validateQuery(paginationQuerySchema), async (req: Request, res: Response) => {
  try {
    const { page, limit, search, sortBy, sortOrder, ...filters } = req.query as any;
    const result = await farmService.getAll({
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
    const item = await farmService.getById(req.params.id);
    if (!item) {
      return sendError(res, 'Farm not found', 404);
    }
    return sendSuccess(res, item);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
});

router.get('/:id/fields', async (req: Request, res: Response) => {
  try {
    const fields = await farmService.getFields(req.params.id);
    return sendSuccess(res, fields);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
});

router.post('/', validateBody(createFarmSchema), async (req: Request, res: Response) => {
  try {
    const item = await farmService.create(req.body);
    return sendSuccess(res, item, 201);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
});

router.put('/:id', validateBody(updateFarmSchema), async (req: Request, res: Response) => {
  try {
    const item = await farmService.update(req.params.id, req.body);
    if (!item) {
      return sendError(res, 'Farm not found', 404);
    }
    return sendSuccess(res, item);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await farmService.delete(req.params.id);
    if (!result.success) {
      return sendError(res, result.error || 'Failed to delete farm', 400);
    }
    return sendSuccess(res, { message: 'Farm deleted successfully' });
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
});

export default router;
