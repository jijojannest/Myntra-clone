import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // Find user with admin role
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check if user is admin
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Account is deactivated',
      });
    }

    // Add admin permissions to request object
    req.admin = {
      id: user._id,
      role: user.role,
      permissions: user.role === 'super_admin' ? '*' : [
        'read:products',
        'write:products',
        'delete:products',
        'read:orders',
        'write:orders',
        'read:users',
        'write:users',
        'read:categories',
        'write:categories',
        'read:coupons',
        'write:coupons',
        'read:analytics',
      ],
    };

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

// Middleware for specific permissions
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: 'Admin access required',
      });
    }

    // Super admin has all permissions
    if (req.admin.permissions === '*') {
      return next();
    }

    if (!req.admin.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: `Permission '${permission}' required`,
      });
    }

    next();
  };
};

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      admin?: {
        id: any;
        role: string;
        permissions: string[] | '*';
      };
    }
  }
}