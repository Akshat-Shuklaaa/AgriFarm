import { Router, Request, Response } from 'express';
import { redis } from '../config/redis';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const ping = await redis.ping();
    const info = await redis.info('server');
    const uptimeSec = process.uptime();

    return sendSuccess(res, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(uptimeSec)}s`,
      redis: {
        connected: ping === 'PONG',
        ping,
      },
    });
  } catch (error: any) {
    return sendError(res, `Health check failed: ${error.message}`, 503);
  }
});

export default router;
