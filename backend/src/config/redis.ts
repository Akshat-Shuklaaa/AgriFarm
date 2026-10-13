import Redis from 'ioredis';
import { config } from './index';

export const redis = config.redis.url
  ? new Redis(config.redis.url, {
      lazyConnect: false,
      retryStrategy(times) {
        return Math.min(times * 100, 3000);
      },
      maxRetriesPerRequest: 3,
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
  const target = config.redis.url ? config.redis.url.replace(/:[^:@]*@/, ':****@') : `${config.redis.host}:${config.redis.port}`;
  console.log(`[Redis] Connected successfully to ${target}`);
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
