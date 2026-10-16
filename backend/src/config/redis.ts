import Redis from 'ioredis';
import { config } from './index';

function getSafeTarget(urlStr?: string, host?: string, port?: number): string {
  if (urlStr) {
    try {
      const u = new URL(urlStr);
      return `${u.protocol}//${u.username ? u.username + ':****@' : ''}${u.host}`;
    } catch {
      return '[Invalid Redis URL]';
    }
  }
  return `${host || 'localhost'}:${port || 6379}`;
}

export const redis = config.redis.url
  ? new Redis(config.redis.url, {
      lazyConnect: false,
      retryStrategy(times) {
        return Math.min(times * 100, 3000);
      },
      maxRetriesPerRequest: 3,
      tls: config.redis.url.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
    })
  : new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      lazyConnect: false,
      retryStrategy(times) {
        return Math.min(times * 100, 3000);
      },
      maxRetriesPerRequest: 3,
    });

redis.on('connect', () => {
  const safeTarget = getSafeTarget(config.redis.url, config.redis.host, config.redis.port);
  console.log(`[Redis] Connected successfully to ${safeTarget}`);
});

redis.on('error', (err) => {
  console.error('[Redis] Connection error:', err);
});

export const closeRedis = async () => {
  try {
    await redis.quit();
    console.log('[Redis] Connection closed cleanly');
  } catch (error) {
    console.error('[Redis] Error closing connection:', error);
  }
};
