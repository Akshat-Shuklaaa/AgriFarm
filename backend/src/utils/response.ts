import { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  pagination?: PaginationMeta
) {
  const payload: {
    success: boolean;
    data: T;
    pagination?: PaginationMeta;
  } = {
    success: true,
    data,
  };

  if (pagination) {
    payload.pagination = {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / (pagination.limit || 1)),
    };
  }

  return res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  error: string,
  statusCode = 400,
  details?: any
) {
  return res.status(statusCode).json({
    success: false,
    error,
    ...(details ? { details } : {}),
  });
}
