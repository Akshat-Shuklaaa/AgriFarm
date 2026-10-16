import { redis } from '../config/redis';
import { getNextId } from '../utils/idGenerator';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  username: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, any>;
  ip?: string;
}

export class AuditService {
  /**
   * Record a security or critical data event to Redis audit log.
   * Strips out any sensitive fields (passwords, tokens, hashes) automatically.
   */
  async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<string> {
    try {
      const id = await getNextId('audit', 'auth:counter:audit');
      const timestamp = new Date().toISOString();
      const score = Date.now();

      // Sanitize details to guarantee no secrets/passwords are recorded
      const sanitizedDetails = entry.details ? this.sanitizeDetails(entry.details) : {};

      const record = {
        id,
        timestamp,
        userId: String(entry.userId || 'system'),
        username: String(entry.username || 'System'),
        userRole: String(entry.userRole || 'system'),
        action: String(entry.action),
        entityType: String(entry.entityType),
        entityId: String(entry.entityId || ''),
        details: JSON.stringify(sanitizedDetails),
        ip: String(entry.ip || ''),
      };

      const pipeline = redis.pipeline();
      pipeline.hset(`auth:audit:${id}`, record);
      pipeline.zadd('auth:audits:index', score, id);
      await pipeline.exec();

      return id;
    } catch (err) {
      // Failure to write an audit log should never crash the main operation, but must be logged
      console.error('[AuditService] Failed to record audit log:', err);
      return '';
    }
  }

  /**
   * Retrieve paginated audit logs (Admin only)
   */
  async getLogs(params: {
    page?: number;
    limit?: number;
    action?: string;
    entityType?: string;
  }) {
    const page = Math.max(1, Number(params.page || 1));
    const limit = Math.min(100, Math.max(1, Number(params.limit || 20)));
    const start = (page - 1) * limit;
    const stop = start + limit - 1;

    // Get IDs sorted newest first (ZREVRANGE)
    const total = await redis.zcard('auth:audits:index');
    const ids = await redis.zrevrange('auth:audits:index', start, stop);

    if (ids.length === 0) {
      return {
        data: [],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      };
    }

    const pipeline = redis.pipeline();
    ids.forEach((id) => pipeline.hgetall(`auth:audit:${id}`));
    const results = await pipeline.exec();

    const data: AuditLogEntry[] = [];
    if (results) {
      for (const [err, record] of results) {
        if (!err && record && Object.keys(record).length > 0) {
          const rec = record as any;
          let parsedDetails = {};
          try {
            parsedDetails = rec.details ? JSON.parse(rec.details) : {};
          } catch {
            parsedDetails = {};
          }
          data.push({
            id: rec.id,
            timestamp: rec.timestamp,
            userId: rec.userId,
            username: rec.username,
            userRole: rec.userRole,
            action: rec.action,
            entityType: rec.entityType,
            entityId: rec.entityId,
            details: parsedDetails,
            ip: rec.ip,
          });
        }
      }
    }

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Recursive sanitizer that omits sensitive keywords from audit payloads
   */
  private sanitizeDetails(obj: Record<string, any>): Record<string, any> {
    const sensitiveKeys = ['password', 'passwordhash', 'token', 'secret', 'jwt', 'authorization', 'cookie'];
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (sensitiveKeys.some((k) => key.toLowerCase().includes(k))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeDetails(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}

export const auditService = new AuditService();
