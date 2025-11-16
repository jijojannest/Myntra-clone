import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  avatar?: string;
  addresses: Array<{
    type: 'home' | 'work' | 'other';
    street: string;
    city: string;
    state: string;
    pincode: string;
    isDefault: boolean;
  }>;
  preferences: {
    sizes: {
      shirt?: string;
      pants?: string;
      shoes?: string;
    };
    brands: string[];
    categories: string[];
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastLogin?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  role: 'user' | 'admin' | 'moderator';
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema({
  type: {
    type: String,
    enum: ['home', 'work', 'other'],
    default: 'home',
  },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true, match: [/^[1-9][0-9]{5}$/, 'Invalid pincode'] },
  isDefault: { type: Boolean, default: false },
});

const PreferencesSchema = new Schema({
  sizes: {
    shirt: String,
    pants: String,
    shoes: String,
  },
  brands: [String],
  categories: [String],
  notifications: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: true },
  },
});

const UserSchema = new Schema<IUser>({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters'],
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please enter a valid email address',
    ],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false,
  },
  phone: {
    type: String,
    match: [/^[6-9]\d{9}$/, 'Please enter a valid phone number'],
  },
  avatar: String,
  addresses: [AddressSchema],
  preferences: {
    type: PreferencesSchema,
    default: () => ({}),
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: Date,
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ phone: 1 });
UserSchema.index({ 'addresses.pincode': 1 });
UserSchema.index({ createdAt: -1 });

// Virtuals
UserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

UserSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > new Date());
});

// Middleware
UserSchema.pre('save', async function(next) {
  // Hash password if modified
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance methods
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < new Date()) {
    return this.updateOne({
      $unset: { lockUntil: 1, loginAttempts: 1 },
      $set: { lastLogin: new Date() },
    });
  }

  const updates: any = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    // Lock account after 5 failed attempts for 2 hours
    updates.$set = { lockUntil: new Date(Date.now() + 2 * 60 * 60 * 1000) };
  }
  return this.updateOne(updates);
};

UserSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { lockUntil: 1, loginAttempts: 1 },
    $set: { lastLogin: new Date() },
  });
};

export const User = mongoose.model<IUser>('User', UserSchema);