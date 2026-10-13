import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('4000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379').transform((val) => parseInt(val, 10)),
  REDIS_PASSWORD: z.string().optional().default(''),
  JWT_SECRET: z.string().default('supersecret_agri_farm_jwt_key_2026_change_in_prod'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  CORS_ORIGINS: z.string().optional(),
  CORS_ORIGIN: z.string().optional().default('http://localhost:3000,http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

const rawCors = parsed.data.CORS_ORIGINS || parsed.data.CORS_ORIGIN || 'http://localhost:3000';
const corsOrigins = rawCors.split(',').map((o) => o.trim()).filter(Boolean);

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
