import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderItem extends Document {
  productId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  discountPrice?: number;
  size: string;
  color: string;
  quantity: number;
  image: string;
  maxQuantity: number;
}

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  orderNumber: string;
  items: IOrderItem[];
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
    phone?: string;
  };
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
    phone?: string;
  };
  paymentInfo: {
    method: 'credit_card' | 'debit_card' | 'upi' | 'net_banking' | 'cod' | 'wallet';
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
    transactionId?: string;
    paymentId?: string;
    paidAt?: Date;
    amount: number;
    currency: string;
  };
  pricing: {
    subtotal: number;
    discount: number;
    shipping: number;
    tax: number;
    total: number;
  };
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned' | 'refunded';
  tracking: Array<{
    status: string;
    timestamp: Date;
    location?: string;
    description: string;
  }>;
  trackingId?: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  shippingMethod: {
    name: string;
    price: number;
    estimatedDays: number;
  };
  couponCode?: string;
  discountAmount?: number;
  giftWrap: boolean;
  giftMessage?: string;
  notes?: string;
  cancellationReason?: string;
  returnRequest?: {
    status: 'requested' | 'approved' | 'rejected' | 'completed';
    items: Array<{
      productId: mongoose.Types.ObjectId;
      reason: string;
      images?: string[];
      refundMethod: 'original' | 'store_credit' | 'bank_transfer';
      status: 'pending' | 'approved' | 'rejected';
    }>;
    requestedAt: Date;
  };
  rating?: {
    overall: number;
    packaging: number;
    delivery: number;
    productQuality: number;
    comment?: string;
    ratedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative'],
  },
  discountPrice: {
    type: Number,
    min: [0, 'Discount price cannot be negative'],
  },
  size: {
    type: String,
    required: true,
    trim: true,
  },
  color: {
    type: String,
    required: true,
    trim: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
  },
  image: {
    type: String,
    required: true,
  },
  maxQuantity: {
    type: Number,
    required: true,
  },
});

const AddressSchema = new Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  landmark: String,
  phone: String,
});

const PaymentInfoSchema = new Schema({
  method: {
    type: String,
    enum: ['credit_card', 'debit_card', 'upi', 'net_banking', 'cod', 'wallet'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  transactionId: String,
  paymentId: String,
  paidAt: Date,
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative'],
  },
  currency: {
    type: String,
    default: 'INR',
  },
});

const PricingSchema = new Schema({
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative'],
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
  },
  shipping: {
    type: Number,
    required: true,
    min: [0, 'Shipping cannot be negative'],
  },
  tax: {
    type: Number,
    default: 0,
    min: [0, 'Tax cannot be negative'],
  },
  total: {
    type: Number,
    required: true,
    min: [0, 'Total cannot be negative'],
  },
});

const TrackingSchema = new Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  location: String,
  description: { type: String, required: true },
});

const OrderSchema = new Schema<IOrder>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  orderNumber: {
    type: String,
    required: true,
    unique: true,
  },
  items: [OrderItemSchema],
  shippingAddress: {
    type: AddressSchema,
    required: true,
  },
  billingAddress: AddressSchema,
  paymentInfo: {
    type: PaymentInfoSchema,
    required: true,
  },
  pricing: {
    type: PricingSchema,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded'],
    default: 'pending',
  },
  tracking: [TrackingSchema],
  trackingId: String,
  estimatedDelivery: Date,
  actualDelivery: Date,
  shippingMethod: {
    type: new Schema({
      name: { type: String, required: true },
      price: { type: Number, required: true, min: 0 },
      estimatedDays: { type: Number, required: true, min: 1 },
    }),
    required: true,
  },
  couponCode: String,
  discountAmount: {
    type: Number,
    default: 0,
    min: [0, 'Discount amount cannot be negative'],
  },
  giftWrap: {
    type: Boolean,
    default: false,
  },
  giftMessage: String,
  notes: String,
  cancellationReason: String,
  returnRequest: {
    status: {
      type: String,
      enum: ['requested', 'approved', 'rejected', 'completed'],
    },
    items: [{
      productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
      reason: { type: String, required: true },
      images: [String],
      refundMethod: {
        type: String,
        enum: ['original', 'store_credit', 'bank_transfer'],
        required: true,
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
      },
    }],
    requestedAt: { type: Date, default: Date.now },
  },
  rating: {
    overall: {
      type: Number,
      min: 1,
      max: 5,
    },
    packaging: {
      type: Number,
      min: 1,
      max: 5,
    },
    delivery: {
      type: Number,
      min: 1,
      max: 5,
    },
    productQuality: {
      type: Number,
      min: 1,
      max: 5,
    },
    comment: String,
    ratedAt: Date,
  },
}, {
  timestamps: true,
});

// Indexes
OrderSchema.index({ userId: 1 });
OrderSchema.index({ orderNumber: 1 }, { unique: true });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ 'paymentInfo.status': 1 });

// Virtuals
OrderItemSchema.virtual('effectivePrice').get(function() {
  return this.discountPrice || this.price;
});

// Instance methods
OrderSchema.methods.addTracking = function(status: string, description: string, location?: string): void {
  this.tracking.push({
    status,
    description,
    location,
    timestamp: new Date(),
  });
};

OrderSchema.methods.updateStatus = function(newStatus: string, reason?: string): void {
  const statusHistory = this.tracking[this.tracking.length - 1];
  if (!statusHistory || statusHistory.status !== newStatus) {
    this.addTracking(newStatus, `Order ${newStatus}`, reason);
  }
  this.status = newStatus as any;

  if (newStatus === 'delivered') {
    this.actualDelivery = new Date();
  }
};

OrderSchema.methods.canCancel = function(): boolean {
  return ['pending', 'confirmed'].includes(this.status);
};

OrderSchema.methods.canReturn = function(): boolean {
  if (this.status !== 'delivered') return false;
  if (!this.actualDelivery) return false;

  const daysSinceDelivery = Math.floor(
    (Date.now() - this.actualDelivery.getTime()) / (1000 * 60 * 60 * 24)
  );

  return daysSinceDelivery <= 30; // 30-day return policy
};

OrderSchema.methods.calculateRefundAmount = function(): number {
  if (!this.canReturn()) return 0;

  // Simple refund calculation (can be made more complex)
  return this.pricing.total - this.pricing.shipping;
};

// Pre-save middleware for order number generation
OrderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const count = await this.constructor.countDocuments();
    this.orderNumber = `ORD${Date.now()}${String(count).padStart(3, '0')}`;
  }
  next();
});

export const Order = mongoose.model<IOrder>('Order', OrderSchema);