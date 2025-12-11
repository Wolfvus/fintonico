import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      404,
      'NOT_FOUND',
      id ? `${resource} with id '${id}' not found` : `${resource} not found`
    );
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, 'FORBIDDEN', message);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: Record<string, string[]>) {
    super(400, 'BAD_REQUEST', message, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}

export class UnbalancedTransactionError extends AppError {
  constructor() {
    super(400, 'UNBALANCED_TRANSACTION', 'Transaction debits must equal credits');
  }
}

export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', error);

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
      ...(error.details && { details: error.details }),
    });
    return;
  }

  if (error instanceof ZodError) {
    const details: Record<string, string[]> = {};
    error.errors.forEach((err) => {
      const path = err.path.join('.');
      if (!details[path]) {
        details[path] = [];
      }
      details[path].push(err.message);
    });

    res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details,
    });
    return;
  }

  // Handle Supabase errors
  if ('code' in error && typeof (error as { code: string }).code === 'string') {
    const supabaseError = error as { code: string; message: string };

    if (supabaseError.code === '23505') {
      res.status(409).json({
        error: 'Resource already exists',
        code: 'DUPLICATE_ENTRY',
      });
      return;
    }

    if (supabaseError.code === '23503') {
      res.status(400).json({
        error: 'Referenced resource does not exist',
        code: 'FOREIGN_KEY_VIOLATION',
      });
      return;
    }
  }

  // Generic server error
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
}
