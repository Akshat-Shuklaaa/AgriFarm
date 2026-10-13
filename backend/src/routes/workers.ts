import { Router, Request, Response } from 'express';
import { workerService } from '../services/workerEquipmentServices';
import { validateBody, validateQuery } from '../middleware/validate';
import {
  createWorkerSchema,
  updateWorkerSchema,
  paginationQuerySchema,
} from '../validation/schemas';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

router.get('/', validateQuery(paginationQuerySchema), async (req: Request, res: Response) => {
  try {
    const { page, limit, search, sortBy, sortOrder, ...filters } = req.query as any;
    const result = await workerService.getAll({
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
    const item = await workerService.getById(req.params.id);
    if (!item) {
      return sendError(res, 'Worker not found', 404);
    }
    return sendSuccess(res, item);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
});

router.get('/:id/attendance', async (req: Request, res: Response) => {
  try {
    const records = await workerService.getAttendance(req.params.id);
    return sendSuccess(res, records);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
});

router.post('/', validateBody(createWorkerSchema), async (req: Request, res: Response) => {
  try {
    const item = await workerService.create(req.body);
    return sendSuccess(res, item, 201);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
});

router.put('/:id', validateBody(updateWorkerSchema), async (req: Request, res: Response) => {
  try {
    const item = await workerService.update(req.params.id, req.body);
    if (!item) {
      return sendError(res, 'Worker not found', 404);
    }
    return sendSuccess(res, item);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await workerService.delete(req.params.id);
    if (!result.success) {
      return sendError(res, result.error || 'Failed to delete worker', 400);
    }
    return sendSuccess(res, { message: 'Worker deleted successfully' });
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
});

export default router;
