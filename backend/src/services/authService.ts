import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { redis } from '../config/redis';
import { config } from '../config';
import { getNextId } from '../utils/idGenerator';
import { Role, ROLES } from '../config/permissions';
import { auditService } from './auditService';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export type SafeUser = Omit<UserRecord, 'passwordHash'>;

export interface SessionData {
  sessionId: string;
  userId: string;
  email: string;
  name: string;
  role: Role;
  csrfToken: string;
  createdAt: string;
  expiresAt: string;
}

export class AuthService {
  private readonly SESSION_TTL_SECONDS = 24 * 60 * 60; // 24 hours
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_SECONDS = 15 * 60; // 15 minutes

  /**
   * Normalize email for safe, case-insensitive comparison
   */
  normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  /**
   * Secure password hashing with bcrypt (12 salt rounds)
   */
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  /**
   * Constant-time password verification against bcrypt hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Verify email uniqueness and create a new user.
   * Atomic via Redis SET NX.
   */
  async createUser(data: {
    name: string;
    email: string;
    password: string;
    role?: Role;
    actor?: { id: string; name: string; role: string };
  }): Promise<SafeUser> {
    const normalizedEmail = this.normalizeEmail(data.email);
    if (!normalizedEmail || !data.password) {
      throw new Error('Email and password are required');
    }

    if (data.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    const assignedRole: Role = data.role && Object.values(ROLES).includes(data.role)
      ? data.role
      : 'worker'; // Least privilege default

    // Non-admin actors cannot assign the Admin role
    if (assignedRole === 'admin' && data.actor && data.actor.role !== 'admin') {
      throw new Error('Only administrators can assign the Admin role');
    }

    const id = await getNextId('user', 'auth:counter:user');

    // Atomic claim of email address
    const claimed = await redis.set(`auth:email:${normalizedEmail}`, id, 'EX', 86400 * 365, 'NX');
    if (!claimed) {
      throw new Error('An account with this email address already exists');
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(data.password, salt);
    const now = new Date().toISOString();

    const userRecord: UserRecord = {
      id,
      name: data.name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: assignedRole,
      status: 'active',
      created_at: now,
      updated_at: now,
    };

    const pipeline = redis.pipeline();
    pipeline.hset(`auth:user:${id}`, userRecord as any);
    pipeline.sadd('auth:users:index', id);
    // Keep email mapping permanent
    pipeline.persist(`auth:email:${normalizedEmail}`);
    await pipeline.exec();

    // Audit log
    await auditService.log({
      userId: data.actor?.id || id,
      username: data.actor?.name || data.name,
      userRole: data.actor?.role || assignedRole,
      action: 'USER_CREATE',
      entityType: 'user',
      entityId: id,
      details: {
        assignedRole,
        createdEmail: normalizedEmail,
        createdName: data.name,
      },
    });

    return this.toSafeUser(userRecord);
  }

  /**
   * Authenticate user with brute-force protection and issue an active Redis session.
   */
  async login(
    credentials: { email: string; password: string },
    ipAddress = 'unknown'
  ): Promise<{ user: SafeUser; token: string; csrfToken: string; sessionId: string }> {
    const normalizedEmail = this.normalizeEmail(credentials.email);
    const attemptKey = `auth:login_attempts:${normalizedEmail}`;

    // 1. Check brute force counter
    const attempts = parseInt((await redis.get(attemptKey)) || '0', 10);
    if (attempts >= this.MAX_LOGIN_ATTEMPTS) {
      const ttl = await redis.ttl(attemptKey);
      const minutesRemaining = Math.max(1, Math.ceil(ttl / 60));
      throw new Error(
        `Account temporarily locked due to excessive failed attempts. Please try again in ${minutesRemaining} minute(s).`
      );
    }

    // 2. Lookup user by email
    const id = await redis.get(`auth:email:${normalizedEmail}`);
    if (!id) {
      await this.recordFailedAttempt(attemptKey);
      throw new Error('Invalid email or password');
    }

    const userRaw = await redis.hgetall(`auth:user:${id}`);
    if (!userRaw || !userRaw.passwordHash) {
      await this.recordFailedAttempt(attemptKey);
      throw new Error('Invalid email or password');
    }

    // Check account status
    if (userRaw.status === 'inactive') {
      throw new Error('Account has been deactivated. Please contact an administrator.');
    }

    // 3. Constant-time password verification
    const isMatch = await bcrypt.compare(credentials.password, userRaw.passwordHash);
    if (!isMatch) {
      await this.recordFailedAttempt(attemptKey);
      throw new Error('Invalid email or password');
    }

    // 4. Reset failed attempts on success
    await redis.del(attemptKey);

    // 5. Create secure session in Redis
    const sessionId = uuidv4();
    const csrfToken = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.SESSION_TTL_SECONDS * 1000).toISOString();

    const sessionPayload: SessionData = {
      sessionId,
      userId: id,
      email: normalizedEmail,
      name: userRaw.name,
      role: userRaw.role as Role,
      csrfToken,
      createdAt: now.toISOString(),
      expiresAt,
    };

    const pipeline = redis.pipeline();
    pipeline.hset(`auth:session:${sessionId}`, sessionPayload as any);
    pipeline.expire(`auth:session:${sessionId}`, this.SESSION_TTL_SECONDS);
    pipeline.sadd(`auth:user:${id}:sessions`, sessionId);
    pipeline.hset(`auth:user:${id}`, 'last_login', now.toISOString());
    await pipeline.exec();

    // 6. Sign JWT token wrapping the session ID
    const token = jwt.sign(
      {
        sessionId,
        id,
        email: normalizedEmail,
        role: userRaw.role,
      },
      config.jwt.secret,
      { expiresIn: `${this.SESSION_TTL_SECONDS}s` }
    );

    const safeUser: SafeUser = {
      id,
      name: userRaw.name,
      email: normalizedEmail,
      role: userRaw.role as Role,
      status: (userRaw.status as 'active' | 'inactive') || 'active',
      created_at: userRaw.created_at,
      updated_at: userRaw.updated_at,
      last_login: now.toISOString(),
    };

    // Audit log
    await auditService.log({
      userId: id,
      username: userRaw.name,
      userRole: userRaw.role,
      action: 'USER_LOGIN',
      entityType: 'session',
      entityId: sessionId,
      ip: ipAddress,
    });

    return {
      user: safeUser,
      token,
      csrfToken,
      sessionId,
    };
  }

  /**
   * Terminate active session and invalidate in Redis.
   */
  async logout(sessionId: string, userId?: string): Promise<void> {
    if (!sessionId) return;

    const pipeline = redis.pipeline();
    pipeline.del(`auth:session:${sessionId}`);
    if (userId) {
      pipeline.srem(`auth:user:${userId}:sessions`, sessionId);
    }
    await pipeline.exec();

    if (userId) {
      await auditService.log({
        userId,
        username: 'User',
        userRole: 'unknown',
        action: 'USER_LOGOUT',
        entityType: 'session',
        entityId: sessionId,
      });
    }
  }

  /**
   * Alias for logout for programmatic session revocation
   */
  async revokeSession(sessionId: string, userId?: string): Promise<void> {
    return this.logout(sessionId, userId);
  }

  /**
   * Validate session stored in Redis and return session payload
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    if (!sessionId) return null;
    const sessionRaw = await redis.hgetall(`auth:session:${sessionId}`);
    if (!sessionRaw || !sessionRaw.userId) {
      return null;
    }
    return sessionRaw as any as SessionData;
  }

  /**
   * Validate session stored in Redis and return the associated SafeUser
   */
  async validateSession(sessionId: string): Promise<SafeUser | null> {
    const session = await this.getSession(sessionId);
    if (!session) return null;
    return this.getUserById(session.userId);
  }

  /**
   * Retrieve a user by ID without exposing password hash
   */
  async getUserById(id: string): Promise<SafeUser | null> {
    const userRaw = await redis.hgetall(`auth:user:${id}`);
    if (!userRaw || !userRaw.id) {
      return null;
    }
    return this.toSafeUser(userRaw as any);
  }

  /**
   * Retrieve a user by email
   */
  async getUserByEmail(email: string): Promise<SafeUser | null> {
    const normalized = this.normalizeEmail(email);
    const id = await redis.get(`auth:email:${normalized}`);
    if (!id) return null;
    return this.getUserById(id);
  }

  /**
   * Paginated list of users (Admin only)
   */
  async listUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }) {
    const page = Math.max(1, Number(params.page || 1));
    const limit = Math.min(100, Math.max(1, Number(params.limit || 20)));

    const allIds = await redis.smembers('auth:users:index');
    if (allIds.length === 0) {
      return { data: [], total: 0, page, limit, totalPages: 1 };
    }

    const pipeline = redis.pipeline();
    allIds.forEach((id) => pipeline.hgetall(`auth:user:${id}`));
    const results = await pipeline.exec();

    let users: SafeUser[] = [];
    if (results) {
      for (const [err, record] of results) {
        if (!err && record && Object.keys(record).length > 0) {
          users.push(this.toSafeUser(record as any));
        }
      }
    }

    // Apply filters
    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      const cleanQ = q.startsWith('#') ? q.slice(1).trim() : q;
      users = users.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(cleanQ) ||
          u.id.toLowerCase().includes(q)
      );
    }

    if (params.role) {
      users = users.filter((u) => u.role === params.role);
    }

    if (params.status) {
      users = users.filter((u) => u.status === params.status);
    }

    // Sort by created_at desc
    users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = users.length;
    const start = (page - 1) * limit;
    const paged = users.slice(start, start + limit);

    return {
      data: paged,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Update a user's role (Admin only)
   */
  async updateUserRole(
    targetUserId: string,
    newRole: Role,
    actor: { id: string; name: string; role: string }
  ): Promise<SafeUser> {
    if (!Object.values(ROLES).includes(newRole)) {
      throw new Error(`Invalid role. Allowed roles: ${Object.values(ROLES).join(', ')}`);
    }

    const user = await this.getUserById(targetUserId);
    if (!user) {
      throw new Error('User not found');
    }

    // Prevent demoting the last admin
    if (user.role === 'admin' && newRole !== 'admin') {
      const adminCount = await this.countAdmins();
      if (adminCount <= 1) {
        throw new Error('Cannot demote the only remaining administrator');
      }
    }

    const now = new Date().toISOString();
    await redis.hset(`auth:user:${targetUserId}`, 'role', newRole, 'updated_at', now);

    // Update active sessions for the user
    const sessionIds = await redis.smembers(`auth:user:${targetUserId}:sessions`);
    if (sessionIds.length > 0) {
      const p = redis.pipeline();
      sessionIds.forEach((sid) => p.hset(`auth:session:${sid}`, 'role', newRole));
      await p.exec();
    }

    await auditService.log({
      userId: actor.id,
      username: actor.name,
      userRole: actor.role,
      action: 'ROLE_CHANGE',
      entityType: 'user',
      entityId: targetUserId,
      details: {
        previousRole: user.role,
        newRole,
        targetEmail: user.email,
      },
    });

    return (await this.getUserById(targetUserId))!;
  }

  /**
   * Activate or deactivate a user account (Admin only).
   * Deactivation immediately revokes all active sessions!
   */
  async updateUserStatus(
    targetUserId: string,
    newStatus: 'active' | 'inactive',
    actor: { id: string; name: string; role: string }
  ): Promise<SafeUser> {
    const user = await this.getUserById(targetUserId);
    if (!user) {
      throw new Error('User not found');
    }

    // Prevent admin from deactivating themselves
    if (targetUserId === actor.id && newStatus === 'inactive') {
      throw new Error('Administrators cannot deactivate their own account');
    }

    // Prevent deactivating the only admin
    if (user.role === 'admin' && newStatus === 'inactive') {
      const adminCount = await this.countAdmins();
      if (adminCount <= 1) {
        throw new Error('Cannot deactivate the only remaining administrator');
      }
    }

    const now = new Date().toISOString();
    await redis.hset(`auth:user:${targetUserId}`, 'status', newStatus, 'updated_at', now);

    // If deactivated, immediately revoke all active sessions!
    if (newStatus === 'inactive') {
      const sessionIds = await redis.smembers(`auth:user:${targetUserId}:sessions`);
      if (sessionIds.length > 0) {
        const p = redis.pipeline();
        sessionIds.forEach((sid) => p.del(`auth:session:${sid}`));
        p.del(`auth:user:${targetUserId}:sessions`);
        await p.exec();
      }
    }

    await auditService.log({
      userId: actor.id,
      username: actor.name,
      userRole: actor.role,
      action: newStatus === 'active' ? 'ACCOUNT_ACTIVATE' : 'ACCOUNT_DEACTIVATE',
      entityType: 'user',
      entityId: targetUserId,
      details: {
        targetEmail: user.email,
        newStatus,
      },
    });

    return (await this.getUserById(targetUserId))!;
  }

  /**
   * Delete a user account (Admin only)
   */
  async deleteUser(
    targetUserId: string,
    actor: { id: string; name: string; role: string }
  ): Promise<void> {
    const user = await this.getUserById(targetUserId);
    if (!user) {
      throw new Error('User not found');
    }

    if (targetUserId === actor.id) {
      throw new Error('Administrators cannot delete their own account');
    }

    if (user.role === 'admin') {
      const adminCount = await this.countAdmins();
      if (adminCount <= 1) {
        throw new Error('Cannot delete the only remaining administrator');
      }
    }

    // Revoke all sessions
    const sessionIds = await redis.smembers(`auth:user:${targetUserId}:sessions`);
    const p = redis.pipeline();
    sessionIds.forEach((sid) => p.del(`auth:session:${sid}`));
    p.del(`auth:user:${targetUserId}:sessions`);
    p.del(`auth:user:${targetUserId}`);
    p.del(`auth:email:${user.email}`);
    p.srem('auth:users:index', targetUserId);
    await p.exec();

    await auditService.log({
      userId: actor.id,
      username: actor.name,
      userRole: actor.role,
      action: 'USER_DELETE',
      entityType: 'user',
      entityId: targetUserId,
      details: {
        deletedEmail: user.email,
        deletedRole: user.role,
      },
    });
  }

  /**
   * Count total active administrators in the system
   */
  async countAdmins(): Promise<number> {
    const userIds = await redis.smembers('auth:users:index');
    if (userIds.length === 0) return 0;

    let adminCount = 0;
    const p = redis.pipeline();
    userIds.forEach((id) => p.hget(`auth:user:${id}`, 'role'));
    const results = await p.exec();
    if (results) {
      for (const [err, role] of results) {
        if (!err && role === 'admin') {
          adminCount++;
        }
      }
    }
    return adminCount;
  }

  /**
   * Convert raw Redis user record to public-safe user object
   */
  private toSafeUser(user: any): SafeUser {
    return {
      id: String(user.id),
      name: String(user.name || ''),
      email: String(user.email || ''),
      role: (user.role as Role) || 'worker',
      status: (user.status as 'active' | 'inactive') || 'active',
      created_at: String(user.created_at || ''),
      updated_at: String(user.updated_at || ''),
      last_login: user.last_login ? String(user.last_login) : undefined,
    };
  }

  private async recordFailedAttempt(key: string): Promise<void> {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, this.LOCKOUT_SECONDS);
    }
  }
}

export const authService = new AuthService();
