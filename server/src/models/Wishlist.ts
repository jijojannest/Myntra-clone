import mongoose, { Document, Schema } from 'mongoose';

export interface IWishlistItem extends Document {
  userId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  discountPrice?: number;
  image: string;
  category: string;
  brand: string;
  addedAt: Date;
}

export interface IWishlist extends Document {
  userId: mongoose.Types.ObjectId;
  items: IWishlistItem[];
  itemCount: number;
  shareToken?: string;
  shareExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WishlistItemSchema = new Schema<IWishlistItem>({
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
  image: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  brand: {
    type: String,
    required: true,
    trim: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const WishlistSchema = new Schema<IWishlist>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  items: [WishlistItemSchema],
  itemCount: {
    type: Number,
    default: 0,
    min: [0, 'Item count cannot be negative'],
  },
  shareToken: {
    type: String,
    sparse: true,
    unique: true,
  },
  shareExpires: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes
WishlistSchema.index({ userId: 1 });
WishlistSchema.index({ shareToken: 1 });
WishlistSchema.index({ shareExpires: 1 });
WishlistItemSchema.index({ userId: 1, productId: 1 }, { unique: true });

// Virtuals
WishlistItemSchema.virtual('effectivePrice').get(function() {
  return this.discountPrice || this.price;
});

WishlistItemSchema.virtual('discountPercentage').get(function() {
  if (!this.discountPrice) return 0;
  return Math.round(((this.price - this.discountPrice) / this.price) * 100);
});

// Middleware
WishlistSchema.pre('save', function(next) {
  this.itemCount = this.items.length;
  next();
});

// Instance methods
WishlistSchema.methods.findItemIndex = function(productId: mongoose.Types.ObjectId): number {
  return this.items.findIndex(item =>
    item.productId.toString() === productId.toString()
  );
};

WishlistSchema.methods.hasItem = function(productId: mongoose.Types.ObjectId): boolean {
  return this.findItemIndex(productId) >= 0;
};

WishlistSchema.methods.addItem = function(item: any): void {
  if (!this.hasItem(item.productId)) {
    this.items.push(item);
  }
});

WishlistSchema.methods.removeItem = function(productId: mongoose.Types.ObjectId): void {
  const itemIndex = this.findItemIndex(productId);

  if (itemIndex >= 0) {
    this.items.splice(itemIndex, 1);
  }
};

WishlistSchema.methods.clearItems = function(): void {
  this.items = [];
};

WishlistSchema.methods.generateShareToken = function(): string {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  this.shareToken = token;
  this.shareExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  return token;
};

WishlistSchema.methods.isShareValid = function(): boolean {
  return !!(this.shareToken && (!this.shareExpires || this.shareExpires > new Date()));
};

export const Wishlist = mongoose.model<IWishlist>('Wishlist', WishlistSchema);
export const WishlistItem = mongoose.model<IWishlistItem>('WishlistItem', WishlistItemSchema);