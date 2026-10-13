import { Router, Request, Response } from 'express';
import { supplierService } from '../services/inventoryServices';
import { validateBody, validateQuery } from '../middleware/validate';
import {
  createSupplierSchema,
  updateSupplierSchema,
  paginationQuerySchema,
} from '../validation/schemas';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

router.get('/', validateQuery(paginationQuerySchema), async (req: Request, res: Response) => {
  try {
    const { page, limit, search, sortBy, sortOrder, ...filters } = req.query as any;
    const result = await supplierService.getAll({
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
    const item = await supplierService.getById(req.params.id);
    if (!item) {
      return sendError(res, 'Supplier not found', 404);
    }
    return sendSuccess(res, item);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
});

router.get('/:id/inventory-items', async (req: Request, res: Response) => {
  try {
    const items = await supplierService.getInventoryItems(req.params.id);
    return sendSuccess(res, items);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
});

router.post('/', validateBody(createSupplierSchema), async (req: Request, res: Response) => {
  try {
    const item = await supplierService.create(req.body);
    return sendSuccess(res, item, 201);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
});

router.put('/:id', validateBody(updateSupplierSchema), async (req: Request, res: Response) => {
  try {
    const item = await supplierService.update(req.params.id, req.body);
    if (!item) {
      return sendError(res, 'Supplier not found', 404);
    }
    return sendSuccess(res, item);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await supplierService.delete(req.params.id);
    if (!result.success) {
      return sendError(res, result.error || 'Failed to delete supplier', 400);
    }
    return sendSuccess(res, { message: 'Supplier deleted successfully' });
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
});

export default router;
