import { Router, Request, Response } from 'express';
import { dashboardService } from '../services/dashboardService';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await dashboardService.getStats();
    return sendSuccess(res, stats);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
});

export default router;
