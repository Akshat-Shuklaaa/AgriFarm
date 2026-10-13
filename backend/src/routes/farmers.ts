import { Router, Request, Response } from 'express';
import { farmerService } from '../services/farmServices';
import { validateBody, validateQuery } from '../middleware/validate';
import {
  createFarmerSchema,
  updateFarmerSchema,
  paginationQuerySchema,
} from '../validation/schemas';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

router.get('/', validateQuery(paginationQuerySchema), async (req: Request, res: Response) => {
  try {
    const { page, limit, search, sortBy, sortOrder, ...filters } = req.query as any;
    const result = await farmerService.getAll({
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
    const item = await farmerService.getById(req.params.id);
    if (!item) {
      return sendError(res, 'Farmer not found', 404);
    }
    return sendSuccess(res, item);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
});

router.get('/:id/farms', async (req: Request, res: Response) => {
  try {
    const farms = await farmerService.getFarms(req.params.id);
    return sendSuccess(res, farms);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
});

router.post('/', validateBody(createFarmerSchema), async (req: Request, res: Response) => {
  try {
    const item = await farmerService.create(req.body);
    return sendSuccess(res, item, 201);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
});

router.put('/:id', validateBody(updateFarmerSchema), async (req: Request, res: Response) => {
  try {
    const item = await farmerService.update(req.params.id, req.body);
    if (!item) {
      return sendError(res, 'Farmer not found', 404);
    }
    return sendSuccess(res, item);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await farmerService.delete(req.params.id);
    if (!result.success) {
      return sendError(res, result.error || 'Failed to delete farmer', 400);
    }
    return sendSuccess(res, { message: 'Farmer deleted successfully' });
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
});

export default router;
