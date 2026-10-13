import { Router, Request, Response } from 'express';
import { equipmentService } from '../services/workerEquipmentServices';
import { validateBody, validateQuery } from '../middleware/validate';
import {
  createEquipmentSchema,
  updateEquipmentSchema,
  paginationQuerySchema,
} from '../validation/schemas';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

router.get('/', validateQuery(paginationQuerySchema), async (req: Request, res: Response) => {
  try {
    const { page, limit, search, sortBy, sortOrder, ...filters } = req.query as any;
    const result = await equipmentService.getAll({
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
    const item = await equipmentService.getById(req.params.id);
    if (!item) {
      return sendError(res, 'Equipment not found', 404);
    }
    return sendSuccess(res, item);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
});

router.get('/:id/maintenance', async (req: Request, res: Response) => {
  try {
    const records = await equipmentService.getMaintenance(req.params.id);
    return sendSuccess(res, records);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
});

router.post('/', validateBody(createEquipmentSchema), async (req: Request, res: Response) => {
  try {
    const item = await equipmentService.create(req.body);
    return sendSuccess(res, item, 201);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
});

router.put('/:id', validateBody(updateEquipmentSchema), async (req: Request, res: Response) => {
  try {
    const item = await equipmentService.update(req.params.id, req.body);
    if (!item) {
      return sendError(res, 'Equipment not found', 404);
    }
    return sendSuccess(res, item);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await equipmentService.delete(req.params.id);
    if (!result.success) {
      return sendError(res, result.error || 'Failed to delete equipment', 400);
    }
    return sendSuccess(res, { message: 'Equipment deleted successfully' });
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
});

export default router;
