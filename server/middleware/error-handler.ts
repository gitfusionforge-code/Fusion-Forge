import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}

export class CustomError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export function createError(message: string, statusCode: number = 500): CustomError {
  return new CustomError(message, statusCode);
}

export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function errorHandler(
  error: Error | AppError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details: any = null;

  // Zod validation errors
  if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    details = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }));
  }
  // Custom application errors
  else if ('statusCode' in error && error.statusCode) {
    statusCode = error.statusCode;
    message = error.message;
  }
  // Database connection errors
  else if (error.message.includes('ECONNREFUSED') || error.message.includes('database')) {
    statusCode = 503;
    message = 'Database connection error';
  }
  // Rate limiting errors
  else if (error.message.includes('rate limit')) {
    statusCode = 429;
    message = 'Too many requests';
  }

  // Log error for monitoring
  console.error(`[ERROR] ${new Date().toISOString()} - ${req.method} ${req.path}`, {
    error: error.message,
    stack: error.stack,
    statusCode,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  // Development vs Production error responses
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(statusCode).json({
    success: false,
    message,
    ...(details && { details }),
    ...(isDevelopment && { 
      stack: error.stack,
      originalError: error.message 
    })
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`
  });
}