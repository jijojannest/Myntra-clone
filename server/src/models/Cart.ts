import mongoose, { Document, Schema } from 'mongoose';

export interface ICartItem extends Document {
  userId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  discountPrice?: number;
  size: string;
  color: string;
  quantity: number;
  image: string;
  maxQuantity: number;
  addedAt: Date;
}

export interface ICart extends Document {
  userId: mongoose.Types.ObjectId;
  items: ICartItem[];
  totalItems: number;
  totalPrice: number;
  totalDiscountPrice: number;
  couponCode?: string;
  discountAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
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
    max: [10, 'Quantity cannot exceed 10'],
    default: 1,
  },
  image: {
    type: String,
    required: true,
  },
  maxQuantity: {
    type: Number,
    required: true,
    min: [1, 'Max quantity must be at least 1'],
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const CartSchema = new Schema<ICart>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  items: [CartItemSchema],
  totalItems: {
    type: Number,
    default: 0,
    min: [0, 'Total items cannot be negative'],
  },
  totalPrice: {
    type: Number,
    default: 0,
    min: [0, 'Total price cannot be negative'],
  },
  totalDiscountPrice: {
    type: Number,
    default: 0,
    min: [0, 'Total discount price cannot be negative'],
  },
  couponCode: {
    type: String,
    trim: true,
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: [0, 'Discount amount cannot be negative'],
  },
}, {
  timestamps: true,
});

// Indexes
CartSchema.index({ userId: 1 });
CartSchema.index({ updatedAt: -1 });
CartItemSchema.index({ userId: 1, productId: 1, size: 1, color: 1 }, { unique: true });

// Virtuals
CartItemSchema.virtual('effectivePrice').get(function() {
  return this.discountPrice || this.price;
});

CartItemSchema.virtual('totalPrice').get(function() {
  return (this.discountPrice || this.price) * this.quantity;
});

// Middleware to calculate totals
CartSchema.pre('save', function(next) {
  this.calculateTotals();
  next();
});

CartSchema.methods.calculateTotals = function() {
  this.totalItems = this.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
  this.totalPrice = this.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  this.totalDiscountPrice = this.items.reduce((sum: number, item: any) => sum + ((item.discountPrice || item.price) * item.quantity), 0);
};

CartSchema.methods.findItemIndex = function(productId: mongoose.Types.ObjectId, size: string, color: string): number {
  return this.items.findIndex(item =>
    item.productId.toString() === productId.toString() &&
    item.size === size &&
    item.color === color
  );
};

CartSchema.methods.addItem = function(item: any): void {
  const existingIndex = this.findItemIndex(item.productId, item.size, item.color);

  if (existingIndex >= 0) {
    // Update existing item
    this.items[existingIndex].quantity = Math.min(
      this.items[existingIndex].quantity + item.quantity,
      this.items[existingIndex].maxQuantity
    );
  } else {
    // Add new item
    this.items.push(item);
  }

  this.calculateTotals();
};

CartSchema.methods.updateItemQuantity = function(productId: mongoose.Types.ObjectId, size: string, color: string, quantity: number): void {
  const itemIndex = this.findItemIndex(productId, size, color);

  if (itemIndex >= 0) {
    if (quantity <= 0) {
      this.items.splice(itemIndex, 1);
    } else {
      this.items[itemIndex].quantity = Math.min(quantity, this.items[itemIndex].maxQuantity);
    }
    this.calculateTotals();
  }
};

CartSchema.methods.removeItem = function(productId: mongoose.Types.ObjectId, size: string, color: string): void {
  const itemIndex = this.findItemIndex(productId, size, color);

  if (itemIndex >= 0) {
    this.items.splice(itemIndex, 1);
    this.calculateTotals();
  }
};

CartSchema.methods.clearItems = function(): void {
  this.items = [];
  this.calculateTotals();
};

export const Cart = mongoose.model<ICart>('Cart', CartSchema);
export const CartItem = mongoose.model<ICartItem>('CartItem', CartItemSchema);