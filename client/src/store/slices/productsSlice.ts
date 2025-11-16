import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { productsAPI } from '../../services/api';

interface Product {
  _id: string;
  name: string;
  description: string;
  brand: string;
  category: string;
  subcategory: string;
  price: number;
  discountPrice?: number;
  sizes: string[];
  colors: Color[];
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
  createdAt: string;
  updatedAt: string;
}

interface Color {
  name: string;
  hex: string;
  images: string[];
}

interface ProductsState {
  products: Product[];
  currentProduct: Product | null;
  featuredProducts: Product[];
  categories: string[];
  brands: string[];
  filters: ProductFilters;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalProducts: number;
    limit: number;
  };
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  sortBy: 'price' | 'popularity' | 'newest' | 'discount';
  sortOrder: 'asc' | 'desc';
}

interface ProductFilters {
  categories: string[];
  brands: string[];
  sizes: string[];
  colors: string[];
  priceRange: [number, number];
  rating: number;
  inStock: boolean;
}

const initialState: ProductsState = {
  products: [],
  currentProduct: null,
  featuredProducts: [],
  categories: [],
  brands: [],
  filters: {
    categories: [],
    brands: [],
    sizes: [],
    colors: [],
    priceRange: [0, 10000],
    rating: 0,
    inStock: true,
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    limit: 20,
  },
  isLoading: false,
  error: null,
  searchQuery: '',
  sortBy: 'popularity',
  sortOrder: 'desc',
};

// Async thunks
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params: {
    page?: number;
    limit?: number;
    category?: string;
    brand?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    minPrice?: number;
    maxPrice?: number;
    sizes?: string[];
    colors?: string[];
  }, { rejectWithValue }) => {
    try {
      const response = await productsAPI.getProducts(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch products');
    }
  }
);

export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (productId: string, { rejectWithValue }) => {
    try {
      const response = await productsAPI.getProductById(productId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch product');
    }
  }
);

export const searchProducts = createAsyncThunk(
  'products/searchProducts',
  async (params: {
    query: string;
    page?: number;
    limit?: number;
    filters?: Partial<ProductFilters>;
  }, { rejectWithValue }) => {
    try {
      const response = await productsAPI.searchProducts(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Search failed');
    }
  }
);

export const fetchFeaturedProducts = createAsyncThunk(
  'products/fetchFeaturedProducts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await productsAPI.getFeaturedProducts();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch featured products');
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'products/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await productsAPI.getCategories();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
    }
  }
);

export const fetchBrands = createAsyncThunk(
  'products/fetchBrands',
  async (_, { rejectWithValue }) => {
    try {
      const response = await productsAPI.getBrands();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch brands');
    }
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<ProductFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSorting: (state, action: PayloadAction<{ sortBy: string; sortOrder: 'asc' | 'desc' }>) => {
      state.sortBy = action.payload.sortBy as any;
      state.sortOrder = action.payload.sortOrder;
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.pagination.currentPage = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload.products;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Product By ID
      .addCase(fetchProductById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProduct = action.payload.product;
        state.error = null;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Search Products
      .addCase(searchProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload.products;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(searchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Featured Products
      .addCase(fetchFeaturedProducts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchFeaturedProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.featuredProducts = action.payload.products;
      })
      .addCase(fetchFeaturedProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Categories
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload.categories;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Fetch Brands
      .addCase(fetchBrands.fulfilled, (state, action) => {
        state.brands = action.payload.brands;
      })
      .addCase(fetchBrands.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  setFilters,
  clearFilters,
  setSearchQuery,
  setSorting,
  setCurrentPage,
  clearError,
  clearCurrentProduct,
} = productsSlice.actions;

export default productsSlice.reducer;