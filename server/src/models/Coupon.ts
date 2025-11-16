import mongoose, { Document, Schema } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  name: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discount: number;
  minAmount: number;
  maxDiscount?: number;
  applicableCategories?: string[];
  applicableProducts?: mongoose.Types.ObjectId[];
  userUsageLimit: number;
  globalUsageLimit: number;
  currentUsage: number;
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true,
  },
  discount: {
    type: Number,
    required: true,
    min: [0, 'Discount cannot be negative'],
  },
  minAmount: {
    type: Number,
    required: true,
    min: [0, 'Minimum amount cannot be negative'],
  },
  maxDiscount: {
    type: Number,
    min: [0, 'Maximum discount cannot be negative'],
    validate: {
      validator: function(this: ICoupon, value: number) {
        // Only validate maxDiscount for percentage discounts
        if (this.discountType === 'percentage' && !value) {
          return false;
        }
        return true;
      },
      message: 'Maximum discount is required for percentage-based coupons',
    },
  },
  applicableCategories: [{
    type: String,
    trim: true,
  }],
  applicableProducts: [{
    type: Schema.Types.ObjectId,
    ref: 'Product',
  }],
  userUsageLimit: {
    type: Number,
    required: true,
    min: [1, 'User usage limit must be at least 1'],
  },
  globalUsageLimit: {
    type: Number,
    required: true,
    min: [1, 'Global usage limit must be at least 1'],
  },
  currentUsage: {
    type: Number,
    default: 0,
    min: [0, 'Current usage cannot be negative'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  startDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(this: ICoupon, value: Date) {
        return value <= this.endDate;
      },
      message: 'Start date must be before end date',
    },
  },
  endDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(this: ICoupon, value: Date) {
        return value >= this.startDate;
      },
      message: 'End date must be after start date',
    },
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes
CouponSchema.index({ code: 1 }, { unique: true });
CouponSchema.index({ isActive: 1 });
CouponSchema.index({ startDate: 1, endDate: 1 });
CouponSchema.index({ applicableCategories: 1 });
CouponSchema.index({ applicableProducts: 1 });

// Instance methods
CouponSchema.methods.isValid = function(orderTotal: number, userUsage: number): { valid: boolean; reason?: string } {
  const now = new Date();

  // Check if coupon is active
  if (!this.isActive) {
    return { valid: false, reason: 'Coupon is inactive' };
  }

  // Check date validity
  if (now < this.startDate || now > this.endDate) {
    return { valid: false, reason: 'Coupon has expired' };
  }

  // Check minimum amount
  if (orderTotal < this.minAmount) {
    return { valid: false, reason: `Minimum order amount of ₹${this.minAmount} required` };
  }

  // Check user usage limit
  if (userUsage >= this.userUsageLimit) {
    return { valid: false, reason: 'Coupon usage limit exceeded' };
  }

  // Check global usage limit
  if (this.currentUsage >= this.globalUsageLimit) {
    return { valid: false, reason: 'Coupon has been fully redeemed' };
  }

  return { valid: true };
};

CouponSchema.methods.calculateDiscount = function(orderTotal: number): number {
  let discount = 0;

  if (this.discountType === 'percentage') {
    discount = (orderTotal * this.discount) / 100;
    if (this.maxDiscount && discount > this.maxDiscount) {
      discount = this.maxDiscount;
    }
  } else {
    discount = this.discount;
  }

  return Math.round(discount * 100) / 100;
};

CouponSchema.methods.incrementUsage = function(): void {
  this.currentUsage += 1;
};

// Static methods
CouponSchema.statics.findActiveCoupons = function() {
  return this.find({
    isActive: true,
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() },
  });
};

CouponSchema.statics.findByCode = function(code: string) {
  return this.findOne({
    code: code.toUpperCase(),
    isActive: true,
  });
};

// Pre-save middleware to ensure code is uppercase
CouponSchema.pre('save', function(next) {
  if (this.isModified('code')) {
    this.code = this.code.toUpperCase();
  }
  next();
});

export const Coupon = mongoose.model<ICoupon>('Coupon', CouponSchema);