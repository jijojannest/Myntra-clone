import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: number;
  errors?: any;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = 'Validation Error';
    const errors = Object.values(err.errors).map((val: any) => ({
      field: val.path,
      message: val.message,
    }));
    error = {
      name: 'ValidationError',
      statusCode: 400,
      message,
      errors,
      isOperational: true,
    };
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `${field} '${value}' already exists`;
    error = {
      name: 'DuplicateKeyError',
      statusCode: 400,
      message,
      isOperational: true,
    };
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = {
      name: 'CastError',
      statusCode: 404,
      message,
      isOperational: true,
    };
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = {
      name: 'JsonWebTokenError',
      statusCode: 401,
      message,
      isOperational: true,
    };
  }

  // JWT expired error
  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = {
      name: 'TokenExpiredError',
      statusCode: 401,
      message,
      isOperational: true,
    };
  }

  // Multer file upload error
  if (err.name === 'MulterError') {
    let message = 'File upload error';
    if (err.message.includes('File too large')) {
      message = 'File is too large';
    } else if (err.message.includes('Unexpected field')) {
      message = 'Unexpected field in file upload';
    }
    error = {
      name: 'MulterError',
      statusCode: 400,
      message,
      isOperational: true,
    };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Internal server error',
    ...(error.errors && { errors: error.errors }),
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error,
    }),
  });
};

export const createError = (message: string, statusCode: number = 500): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};