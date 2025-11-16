import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { wishlistAPI } from '../../services/api';

interface WishlistItem {
  productId: string;
  name: string;
  price: number;
  discountPrice?: number;
  image: string;
  category: string;
  brand: string;
  addedAt: string;
}

interface WishlistState {
  items: WishlistItem[];
  itemCount: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: WishlistState = {
  items: [],
  itemCount: 0,
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// Async thunks
export const fetchWishlist = createAsyncThunk(
  'wishlist/fetchWishlist',
  async (_, { rejectWithValue }) => {
    try {
      const response = await wishlistAPI.getWishlist();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch wishlist');
    }
  }
);

export const addToWishlist = createAsyncThunk(
  'wishlist/addToWishlist',
  async (productId: string, { rejectWithValue }) => {
    try {
      const response = await wishlistAPI.addToWishlist(productId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add to wishlist');
    }
  }
);

export const removeFromWishlist = createAsyncThunk(
  'wishlist/removeFromWishlist',
  async (productId: string, { rejectWithValue }) => {
    try {
      await wishlistAPI.removeFromWishlist(productId);
      return productId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove from wishlist');
    }
  }
);

export const clearWishlist = createAsyncThunk(
  'wishlist/clearWishlist',
  async (_, { rejectWithValue }) => {
    try {
      await wishlistAPI.clearWishlist();
      return true;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to clear wishlist');
    }
  }
);

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateItemCount: (state) => {
      state.itemCount = state.items.length;
      state.lastUpdated = new Date().toISOString();
    },
    // Optimistic updates for better UX
    optimisticAddToWishlist: (state, action: PayloadAction<WishlistItem>) => {
      if (!state.items.find(item => item.productId === action.payload.productId)) {
        state.items.push(action.payload);
        state.itemCount = state.items.length;
        state.lastUpdated = new Date().toISOString();
      }
    },
    optimisticRemoveFromWishlist: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.productId !== action.payload);
      state.itemCount = state.items.length;
      state.lastUpdated = new Date().toISOString();
    },
    toggleWishlistItem: (state, action: PayloadAction<WishlistItem>) => {
      const existingIndex = state.items.findIndex(item => item.productId === action.payload.productId);
      if (existingIndex >= 0) {
        state.items.splice(existingIndex, 1);
      } else {
        state.items.push(action.payload);
      }
      state.itemCount = state.items.length;
      state.lastUpdated = new Date().toISOString();
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Wishlist
      .addCase(fetchWishlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.items;
        state.itemCount = action.payload.itemCount;
        state.lastUpdated = action.payload.lastUpdated;
        state.error = null;
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Add to Wishlist
      .addCase(addToWishlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.items;
        state.itemCount = action.payload.itemCount;
        state.lastUpdated = action.payload.lastUpdated;
        state.error = null;
      })
      .addCase(addToWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Remove from Wishlist
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.productId !== action.payload);
        state.itemCount = state.items.length;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(removeFromWishlist.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Clear Wishlist
      .addCase(clearWishlist.fulfilled, (state) => {
        state.items = [];
        state.itemCount = 0;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(clearWishlist.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  updateItemCount,
  optimisticAddToWishlist,
  optimisticRemoveFromWishlist,
  toggleWishlistItem,
} = wishlistSlice.actions;

export default wishlistSlice.reducer;