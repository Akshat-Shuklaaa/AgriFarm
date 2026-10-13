import { Router, Request, Response } from 'express';
import { seasonService } from '../services/cropServices';
import { validateBody, validateQuery } from '../middleware/validate';
import {
  createSeasonSchema,
  updateSeasonSchema,
  paginationQuerySchema,
} from '../validation/schemas';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

router.get('/', validateQuery(paginationQuerySchema), async (req: Request, res: Response) => {
  try {
    const { page, limit, search, sortBy, sortOrder, ...filters } = req.query as any;
    const result = await seasonService.getAll({
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
    const item = await seasonService.getById(req.params.id);
    if (!item) {
      return sendError(res, 'Season not found', 404);
    }
    return sendSuccess(res, item);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
});

router.get('/:id/crop-seasons', async (req: Request, res: Response) => {
  try {
    const items = await seasonService.getCropSeasons(req.params.id);
    return sendSuccess(res, items);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
});

router.post('/', validateBody(createSeasonSchema), async (req: Request, res: Response) => {
  try {
    const item = await seasonService.create(req.body);
    return sendSuccess(res, item, 201);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
});

router.put('/:id', validateBody(updateSeasonSchema), async (req: Request, res: Response) => {
  try {
    const item = await seasonService.update(req.params.id, req.body);
    if (!item) {
      return sendError(res, 'Season not found', 404);
    }
    return sendSuccess(res, item);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await seasonService.delete(req.params.id);
    if (!result.success) {
      return sendError(res, result.error || 'Failed to delete season', 400);
    }
    return sendSuccess(res, { message: 'Season deleted successfully' });
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
});

export default router;
