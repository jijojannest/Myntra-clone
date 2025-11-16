import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, IUser } from '../models/User';
import { Cart } from '../models/Cart';
import { Wishlist } from '../models/Wishlist';
import { AuthRequest, asyncHandler, createError } from '../middleware/errorHandler';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService';

// Generate JWT token
const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRE || '15m',
  });
};

// Generate refresh token
const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
  });
};

// Register user
export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { firstName, lastName, email, password, phone } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { phone }],
  });

  if (existingUser) {
    const field = existingUser.email === email ? 'email' : 'phone';
    return res.status(400).json({
      success: false,
      error: `User with this ${field} already exists`,
    });
  }

  // Create new user
  const user = new User({
    firstName,
    lastName,
    email,
    password,
    phone,
    emailVerificationToken: crypto.randomBytes(32).toString('hex'),
  });

  await user.save();

  // Create empty cart and wishlist
  await Cart.create({ userId: user._id });
  await Wishlist.create({ userId: user._id });

  // Send verification email
  try {
    await sendVerificationEmail(user.email, user.emailVerificationToken!);
  } catch (error) {
    console.error('Failed to send verification email:', error);
  }

  // Generate tokens
  const token = generateToken(user._id.toString());
  const refreshToken = generateRefreshToken(user._id.toString());

  // Remove password from response
  const userResponse = user.toJSON();
  delete userResponse.password;

  res.status(201).json({
    success: true,
    data: {
      user: userResponse,
      token,
      refreshToken,
    },
    message: 'Registration successful. Please check your email for verification.',
  });
});

// Login user
export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { email, password } = req.body;

  // Find user with password
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Invalid email or password',
    });
  }

  // Check if account is locked
  if (user.isLocked) {
    return res.status(423).json({
      success: false,
      error: 'Account locked due to multiple failed login attempts. Try again later.',
    });
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    await user.incLoginAttempts();
    return res.status(401).json({
      success: false,
      error: 'Invalid email or password',
    });
  }

  // Reset login attempts
  await user.resetLoginAttempts();

  // Check if user is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      error: 'Your account has been deactivated',
    });
  }

  // Generate tokens
  const token = generateToken(user._id.toString());
  const refreshToken = generateRefreshToken(user._id.toString());

  // Remove password from response
  const userResponse = user.toJSON();
  delete userResponse.password;

  res.status(200).json({
    success: true,
    data: {
      user: userResponse,
      token,
      refreshToken,
    },
    message: 'Login successful',
  });
});

// Get user profile
export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;

  res.status(200).json({
    success: true,
    data: { user },
  });
});

// Update user profile
export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: errors.array(),
    });
  }

  const allowedUpdates = [
    'firstName',
    'lastName',
    'phone',
    'addresses',
    'preferences',
  ];

  const updates: any = {};
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw createError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    data: { user },
    message: 'Profile updated successfully',
  });
});

// Forgot password
export const forgotPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    // Don't reveal that user doesn't exist
    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = resetToken;
  user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await user.save();

  // Send reset email
  try {
    await sendPasswordResetEmail(user.email, resetToken);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw createError('Failed to send password reset email', 500);
  }

  res.status(200).json({
    success: true,
    message: 'Password reset link sent to your email',
  });
});

// Reset password
export const resetPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { token, newPassword } = req.body;

  // Find user with valid reset token
  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      error: 'Invalid or expired reset token',
    });
  }

  // Update password
  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password reset successful',
  });
});

// Change password
export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  if (!user) {
    throw createError('User not found', 404);
  }

  // Check current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);

  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      error: 'Current password is incorrect',
    });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
  });
});

// Refresh token
export const refreshToken = asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { refreshToken } = req.body;

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      throw createError('Invalid refresh token', 401);
    }

    const newToken = generateToken(user._id.toString());

    res.status(200).json({
      success: true,
      data: { token: newToken },
    });
  } catch (error) {
    throw createError('Invalid refresh token', 401);
  }
});

// Verify email
export const verifyEmail = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { token } = req.body;

  const user = await User.findOne({ emailVerificationToken: token });

  if (!user) {
    return res.status(400).json({
      success: false,
      error: 'Invalid verification token',
    });
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Email verified successfully',
  });
});

// Logout user
export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  // In a stateless JWT setup, logout is mainly client-side
  // You can implement token blacklisting if needed
  res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
});