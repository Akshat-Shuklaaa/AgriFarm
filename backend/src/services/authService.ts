import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { redis } from '../config/redis';
import { config } from '../config';
import { getNextId } from '../utils/idGenerator';

export interface UserRecord {
  id: string;
  username: string;
  passwordHash: string;
  role: string;
  email?: string;
  created_at: string;
}

export class AuthService {
  async register(data: { username: string; password: string; role?: string; email?: string }) {
    const existingId = await redis.get(`users:by_username:${data.username.toLowerCase()}`);
    if (existingId) {
      throw new Error('Username already exists');
    }

    const id = await getNextId('user');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const userObj = {
      id,
      username: data.username,
      passwordHash,
      role: data.role || 'farmer',
      email: data.email || '',
      created_at: new Date().toISOString(),
    };

    const pipeline = redis.pipeline();
    pipeline.hset(`user:${id}`, userObj);
    pipeline.set(`users:by_username:${data.username.toLowerCase()}`, id);
    pipeline.sadd('users:index', id);
    await pipeline.exec();

    const token = jwt.sign(
      { id, username: data.username, role: userObj.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn as any }
    );

    return {
      user: {
        id,
        username: data.username,
        role: userObj.role,
        email: userObj.email,
      },
      token,
    };
  }

  async login(data: { username: string; password: string }) {
    const id = await redis.get(`users:by_username:${data.username.toLowerCase()}`);
    if (!id) {
      throw new Error('Invalid username or password');
    }

    const userRaw = await redis.hgetall(`user:${id}`);
    if (!userRaw || !userRaw.passwordHash) {
      throw new Error('Invalid username or password');
    }

    const isMatch = await bcrypt.compare(data.password, userRaw.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid username or password');
    }

    const token = jwt.sign(
      { id, username: userRaw.username, role: userRaw.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn as any }
    );

    return {
      user: {
        id,
        username: userRaw.username,
        role: userRaw.role,
        email: userRaw.email,
      },
      token,
    };
  }

  async getUserById(id: string) {
    const userRaw = await redis.hgetall(`user:${id}`);
    if (!userRaw || !userRaw.id) {
      return null;
    }
    return {
      id: userRaw.id,
      username: userRaw.username,
      role: userRaw.role,
      email: userRaw.email,
      created_at: userRaw.created_at,
    };
  }
}

export const authService = new AuthService();
