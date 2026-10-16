import { Router, Request, Response } from 'express';
import {
  farmerPhoneService,
  supplierPhoneService,
  workerPhoneService,
  customerPhoneService,
} from '../services/phoneServices';
import { validateBody, validateQuery } from '../middleware/validate';
import {
  createFarmerPhoneSchema,
  updateFarmerPhoneSchema,
  createSupplierPhoneSchema,
  updateSupplierPhoneSchema,
  createWorkerPhoneSchema,
  updateWorkerPhoneSchema,
  createCustomerPhoneSchema,
  updateCustomerPhoneSchema,
  paginationQuerySchema,
} from '../validation/schemas';
import { sendSuccess, sendError } from '../utils/response';
import { authenticateSession, authorizeEntity } from '../middleware/auth';

const router = Router();

// Enforce session authentication and resource-level RBAC
router.use(authenticateSession);
router.use('/farmer', authorizeEntity('farmerPhones'));
router.use('/supplier', authorizeEntity('supplierPhones'));
router.use('/worker', authorizeEntity('workerPhones'));
router.use('/customer', authorizeEntity('customerPhones'));

// ================= Farmer Phone =================
router.get('/farmer', validateQuery(paginationQuerySchema), async (req: Request, res: Response) => {
  try {
    const { page, limit, search, sortBy, sortOrder, ...filters } = req.query as any;
    const result = await farmerPhoneService.getAll({ page, limit, search, sortBy, sortOrder, filter: filters });
    return sendSuccess(res, result.data, 200, { page: result.page, limit: result.limit, total: result.total });
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
});

router.post('/farmer', validateBody(createFarmerPhoneSchema), async (req: Request, res: Response) => {
  try {
    const item = await farmerPhoneService.create(req.body);
    return sendSuccess(res, item, 201);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
});

router.delete('/farmer/:id', async (req: Request, res: Response) => {
  try {
    const result = await farmerPhoneService.delete(req.params.id);
    if (!result.success) return sendError(res, result.error || 'Failed to delete record', 400);
    return sendSuccess(res, { message: 'Phone record deleted successfully' });
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
});

// ================= Supplier Phone =================
router.get('/supplier', validateQuery(paginationQuerySchema), async (req: Request, res: Response) => {
  try {
    const { page, limit, search, sortBy, sortOrder, ...filters } = req.query as any;
    const result = await supplierPhoneService.getAll({ page, limit, search, sortBy, sortOrder, filter: filters });
    return sendSuccess(res, result.data, 200, { page: result.page, limit: result.limit, total: result.total });
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
});

router.post('/supplier', validateBody(createSupplierPhoneSchema), async (req: Request, res: Response) => {
  try {
    const item = await supplierPhoneService.create(req.body);
    return sendSuccess(res, item, 201);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
});

router.delete('/supplier/:id', async (req: Request, res: Response) => {
  try {
    const result = await supplierPhoneService.delete(req.params.id);
    if (!result.success) return sendError(res, result.error || 'Failed to delete record', 400);
    return sendSuccess(res, { message: 'Phone record deleted successfully' });
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
});

// ================= Worker Phone =================
router.get('/worker', validateQuery(paginationQuerySchema), async (req: Request, res: Response) => {
  try {
    const { page, limit, search, sortBy, sortOrder, ...filters } = req.query as any;
    const result = await workerPhoneService.getAll({ page, limit, search, sortBy, sortOrder, filter: filters });
    return sendSuccess(res, result.data, 200, { page: result.page, limit: result.limit, total: result.total });
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
});

router.post('/worker', validateBody(createWorkerPhoneSchema), async (req: Request, res: Response) => {
  try {
    const item = await workerPhoneService.create(req.body);
    return sendSuccess(res, item, 201);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
});

router.delete('/worker/:id', async (req: Request, res: Response) => {
  try {
    const result = await workerPhoneService.delete(req.params.id);
    if (!result.success) return sendError(res, result.error || 'Failed to delete record', 400);
    return sendSuccess(res, { message: 'Phone record deleted successfully' });
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
});

// ================= Customer Phone =================
router.get('/customer', validateQuery(paginationQuerySchema), async (req: Request, res: Response) => {
  try {
    const { page, limit, search, sortBy, sortOrder, ...filters } = req.query as any;
    const result = await customerPhoneService.getAll({ page, limit, search, sortBy, sortOrder, filter: filters });
    return sendSuccess(res, result.data, 200, { page: result.page, limit: result.limit, total: result.total });
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
});

router.post('/customer', validateBody(createCustomerPhoneSchema), async (req: Request, res: Response) => {
  try {
    const item = await customerPhoneService.create(req.body);
    return sendSuccess(res, item, 201);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
});

router.delete('/customer/:id', async (req: Request, res: Response) => {
  try {
    const result = await customerPhoneService.delete(req.params.id);
    if (!result.success) return sendError(res, result.error || 'Failed to delete record', 400);
    return sendSuccess(res, { message: 'Phone record deleted successfully' });
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
});

export default router;
