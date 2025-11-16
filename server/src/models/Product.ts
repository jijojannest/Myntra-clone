import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  brand: string;
  category: string;
  subcategory: string;
  price: number;
  discountPrice?: number;
  sizes: string[];
  colors: Array<{
    name: string;
    hex: string;
    images: string[];
  }>;
  images: string[];
  tryOnImages?: string[];
  specifications: {
    material: string;
    care: string;
    fit: string;
  };
  rating: number;
  reviewCount: number;
  stock: Record<string, number>;
  tags: string[];
  isActive: boolean;
  featured: boolean;
  newArrival: boolean;
  bestSeller: boolean;
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const ColorSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  hex: {
    type: String,
    required: true,
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color'],
  },
  images: [{
    type: String,
    required: true,
  }],
});

const SpecificationsSchema = new Schema({
  material: { type: String, required: true },
  care: { type: String, required: true },
  fit: { type: String, enum: ['slim', 'regular', 'loose', 'oversized'], required: true },
});

const SEOSchema = new Schema({
  title: { type: String, trim: true },
  description: { type: String, trim: true },
  keywords: [String],
});

const ProductSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters'],
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true,
    maxlength: [100, 'Brand name cannot exceed 100 characters'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
  },
  subcategory: {
    type: String,
    required: [true, 'Subcategory is required'],
    trim: true,
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  },
  discountPrice: {
    type: Number,
    min: [0, 'Discount price cannot be negative'],
    validate: {
      validator: function(v: number) {
        return !v || v < this.price;
      },
      message: 'Discount price must be less than regular price',
    },
  },
  sizes: [{
    type: String,
    enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '28', '30', '32', '34', '36', '38', '40'],
  }],
  colors: [ColorSchema],
  images: [{
    type: String,
    required: true,
  }],
  tryOnImages: [String],
  specifications: {
    type: SpecificationsSchema,
    required: true,
  },
  rating: {
    type: Number,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot be more than 5'],
    default: 0,
  },
  reviewCount: {
    type: Number,
    min: [0, 'Review count cannot be negative'],
    default: 0,
  },
  stock: {
    type: Map,
    of: Number,
    default: new Map(),
    validate: {
      validator: function(v: Map<string, number>) {
        for (const [size, quantity] of v.entries()) {
          if (quantity < 0) return false;
        }
        return true;
      },
      message: 'Stock quantity cannot be negative',
    },
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  newArrival: {
    type: Boolean,
    default: false,
  },
  bestSeller: {
    type: Boolean,
    default: false,
  },
  seo: SEOSchema,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ category: 1 });
ProductSchema.index({ subcategory: 1 });
ProductSchema.index({ brand: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ rating: -1 });
ProductSchema.index({ reviewCount: -1 });
ProductSchema.index({ featured: 1, isActive: 1 });
ProductSchema.index({ newArrival: 1, isActive: 1 });
ProductSchema.index({ bestSeller: 1, isActive: 1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ updatedAt: -1 });

// Virtuals
ProductSchema.virtual('discountPercentage').get(function() {
  if (!this.discountPrice) return 0;
  return Math.round(((this.price - this.discountPrice) / this.price) * 100);
});

ProductSchema.virtual('inStock').get(function() {
  return Array.from(this.stock.values()).some(qty => qty > 0);
});

ProductSchema.virtual('availableSizes').get(function() {
  return Array.from(this.stock.entries())
    .filter(([_, qty]) => qty > 0)
    .map(([size, _]) => size);
});

// Instance methods
ProductSchema.methods.getStockForSize = function(size: string): number {
  return this.stock.get(size) || 0;
};

ProductSchema.methods.updateStock = function(size: string, quantity: number): Promise<any> {
  const currentStock = this.stock.get(size) || 0;
  const newStock = Math.max(0, currentStock + quantity);
  this.stock.set(size, newStock);
  return this.save();
};

export const Product = mongoose.model<IProduct>('Product', ProductSchema);