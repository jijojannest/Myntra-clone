import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Content Security Policy configuration
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  "connect-src 'self' https:",
  "frame-ancestors 'none'",
  "frame-src 'self'",
];

// Security middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: { policy: "require-corp" },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: { allowList: ["'self'"] },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true,
});

// Rate limiting configuration
export const createRateLimiter = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: message || 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// General rate limiter for all routes
export const generalLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100,
  'Too many requests, please try again later.'
);

// Strict rate limiter for sensitive routes
export const strictLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  20,
  'Too many requests from this IP, please try again later.'
);

// Authentication rate limiter
export const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5,
  'Too many login attempts. Please try again later.'
);

// API rate limiter
export const apiLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  200,
  'API rate limit exceeded. Please try again later.'
);

// CORS configuration
export const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://yourdomain.com'] // Add production domains
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
};

// Input validation middleware
export const validateContentType = (contentType: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.headers['content-type']?.includes(contentType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid content type. Expected ${contentType}`,
      });
    }
    next();
  };
};

// Request size limiter
export const requestSizeLimiter = (maxSize: number = 10 * 1024 * 1024) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.headers['content-length'];
    if (contentLength && parseInt(contentLength) > maxSize) {
      return res.status(413).json({
        success: false,
        error: 'Request entity too large',
      });
    }
    next();
  };
};

// IP blocking middleware
const blockedIPs = new Set<string>(); // In production, load from database

export const ipBlocker = (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip || req.connection.remoteAddress;

  if (clientIP && blockedIPs.has(clientIP)) {
    return res.status(403).json({
      success: false,
      error: 'Access denied',
    });
  }
  next();
};

// Trust proxy middleware
export const trustProxy = helmet({
  hsts: false,
});

// Remove sensitive data from responses
export const sanitizeResponse = (req: Request, res: Response, next: NextFunction) => {
  res.removeHeader('X-Powered-By');
  res.removeHeader('X-AspNet-Version');
  next();
};