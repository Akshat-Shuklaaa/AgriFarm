import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('4000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  REDIS_URL: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      let clean = val.trim();
      // Remove accidental quotes wrapping the entire URL
      if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
        clean = clean.slice(1, -1).trim();
      }
      // If user accidentally copied the CLI command e.g. "redis-cli -u redis://..." or "redis-cli -u rediss://..."
      const cliMatch = clean.match(/redis-cli\s+(?:-[a-zA-Z]+\s+)*-u\s+([^\s]+)/);
      if (cliMatch) {
        clean = cliMatch[1].trim();
      }
      return clean;
    })
    .refine((val) => {
      if (!val) return true;
      try {
        const u = new URL(val);
        return u.protocol === 'redis:' || u.protocol === 'rediss:';
      } catch {
        return false;
      }
    }, {
      message: "REDIS_URL must be a valid Redis connection URL starting with 'redis://' or 'rediss://' (e.g. redis://default:password@host:port), not a redis-cli command or shell string",
    }),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379').transform((val) => parseInt(val, 10)),
  REDIS_PASSWORD: z.string().optional().default(''),
  JWT_SECRET: z.string().default('supersecret_agri_farm_jwt_key_2026_change_in_prod'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  CORS_ORIGINS: z.string().optional(),
  CORS_ORIGIN: z.string().optional().default('http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173'),
}).refine((data) => {
  if (data.NODE_ENV === 'production' && !data.REDIS_URL && data.REDIS_HOST === 'localhost') {
    return false;
  }
  return true;
}, {
  message: 'In production (NODE_ENV=production), REDIS_URL must be set to a remote Redis database and cannot silently fall back to localhost.',
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

const rawCors = parsed.data.CORS_ORIGINS || parsed.data.CORS_ORIGIN || 'http://localhost:3000';
const corsOrigins = rawCors.split(',').map((o) => o.trim().replace(/\/+$/, '')).filter(Boolean);

export const config = {
  port: parsed.data.PORT,
  nodeEnv: parsed.data.NODE_ENV,
  redis: {
    url: parsed.data.REDIS_URL || undefined,
    host: parsed.data.REDIS_HOST,
    port: parsed.data.REDIS_PORT,
    password: parsed.data.REDIS_PASSWORD || undefined,
  },
  jwt: {
    secret: parsed.data.JWT_SECRET,
    expiresIn: parsed.data.JWT_EXPIRES_IN,
  },
  corsOrigins,
};
