import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface UIState {
  // Loading states
  isPageLoading: boolean;
  isLoading: boolean;

  // Modal states
  isCartOpen: boolean;
  isWishlistOpen: boolean;
  isMobileMenuOpen: boolean;
  isSearchOpen: boolean;
  isFilterOpen: boolean;

  // Product view
  productView: 'grid' | 'list';

  // Notifications
  toasts: Toast[];

  // Theme
  theme: 'light' | 'dark';

  // Layout
  isSidebarCollapsed: boolean;

  // Virtual Try-On
  isVirtualTryOnOpen: boolean;
  virtualTryOnProductId: string | null;

  // Search
  searchSuggestions: string[];
  isSearchLoading: boolean;

  // Filters
  activeFilters: string[];

  // Pagination
  currentPage: number;

  // Error states
  globalError: string | null;
}

const initialState: UIState = {
  isPageLoading: false,
  isLoading: false,

  isCartOpen: false,
  isWishlistOpen: false,
  isMobileMenuOpen: false,
  isSearchOpen: false,
  isFilterOpen: false,

  productView: 'grid',

  toasts: [],

  theme: 'light',

  isSidebarCollapsed: false,

  isVirtualTryOnOpen: false,
  virtualTryOnProductId: null,

  searchSuggestions: [],
  isSearchLoading: false,

  activeFilters: [],

  currentPage: 1,

  globalError: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Loading states
    setPageLoading: (state, action: PayloadAction<boolean>) => {
      state.isPageLoading = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Modal states
    toggleCart: (state) => {
      state.isCartOpen = !state.isCartOpen;
      if (state.isCartOpen) {
        state.isWishlistOpen = false;
        state.isMobileMenuOpen = false;
      }
    },
    closeCart: (state) => {
      state.isCartOpen = false;
    },
    openCart: (state) => {
      state.isCartOpen = true;
      state.isWishlistOpen = false;
      state.isMobileMenuOpen = false;
    },

    toggleWishlist: (state) => {
      state.isWishlistOpen = !state.isWishlistOpen;
      if (state.isWishlistOpen) {
        state.isCartOpen = false;
        state.isMobileMenuOpen = false;
      }
    },
    closeWishlist: (state) => {
      state.isWishlistOpen = false;
    },
    openWishlist: (state) => {
      state.isWishlistOpen = true;
      state.isCartOpen = false;
      state.isMobileMenuOpen = false;
    },

    toggleMobileMenu: (state) => {
      state.isMobileMenuOpen = !state.isMobileMenuOpen;
      if (state.isMobileMenuOpen) {
        state.isCartOpen = false;
        state.isWishlistOpen = false;
      }
    },
    closeMobileMenu: (state) => {
      state.isMobileMenuOpen = false;
    },
    openMobileMenu: (state) => {
      state.isMobileMenuOpen = true;
      state.isCartOpen = false;
      state.isWishlistOpen = false;
    },

    toggleSearch: (state) => {
      state.isSearchOpen = !state.isSearchOpen;
    },
    closeSearch: (state) => {
      state.isSearchOpen = false;
    },
    openSearch: (state) => {
      state.isSearchOpen = true;
    },

    toggleFilter: (state) => {
      state.isFilterOpen = !state.isFilterOpen;
    },
    closeFilter: (state) => {
      state.isFilterOpen = false;
    },
    openFilter: (state) => {
      state.isFilterOpen = true;
    },

    closeAllModals: (state) => {
      state.isCartOpen = false;
      state.isWishlistOpen = false;
      state.isMobileMenuOpen = false;
      state.isSearchOpen = false;
      state.isFilterOpen = false;
    },

    // Product view
    setProductView: (state, action: PayloadAction<'grid' | 'list'>) => {
      state.productView = action.payload;
    },
    toggleProductView: (state) => {
      state.productView = state.productView === 'grid' ? 'list' : 'grid';
    },

    // Notifications/Toasts
    addToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      const id = Date.now().toString();
      const toast: Toast = {
        id,
        duration: 5000,
        ...action.payload,
      };
      state.toasts.push(toast);
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter(toast => toast.id !== action.payload);
    },
    clearToasts: (state) => {
      state.toasts = [];
    },

    // Theme
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },

    // Layout
    toggleSidebar: (state) => {
      state.isSidebarCollapsed = !state.isSidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isSidebarCollapsed = action.payload;
    },

    // Virtual Try-On
    openVirtualTryOn: (state, action: PayloadAction<string>) => {
      state.isVirtualTryOnOpen = true;
      state.virtualTryOnProductId = action.payload;
    },
    closeVirtualTryOn: (state) => {
      state.isVirtualTryOnOpen = false;
      state.virtualTryOnProductId = null;
    },
    toggleVirtualTryOn: (state, action: PayloadAction<string | undefined>) => {
      if (state.isVirtualTryOnOpen) {
        state.isVirtualTryOnOpen = false;
        state.virtualTryOnProductId = null;
      } else {
        state.isVirtualTryOnOpen = true;
        state.virtualTryOnProductId = action.payload || null;
      }
    },

    // Search
    setSearchSuggestions: (state, action: PayloadAction<string[]>) => {
      state.searchSuggestions = action.payload;
    },
    clearSearchSuggestions: (state) => {
      state.searchSuggestions = [];
    },
    setSearchLoading: (state, action: PayloadAction<boolean>) => {
      state.isSearchLoading = action.payload;
    },

    // Filters
    setActiveFilters: (state, action: PayloadAction<string[]>) => {
      state.activeFilters = action.payload;
    },
    addActiveFilter: (state, action: PayloadAction<string>) => {
      if (!state.activeFilters.includes(action.payload)) {
        state.activeFilters.push(action.payload);
      }
    },
    removeActiveFilter: (state, action: PayloadAction<string>) => {
      state.activeFilters = state.activeFilters.filter(filter => filter !== action.payload);
    },
    clearActiveFilters: (state) => {
      state.activeFilters = [];
    },

    // Pagination
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },

    // Error handling
    setGlobalError: (state, action: PayloadAction<string | null>) => {
      state.globalError = action.payload;
    },
    clearGlobalError: (state) => {
      state.globalError = null;
    },
  },
});

export const {
  setPageLoading,
  setLoading,
  toggleCart,
  closeCart,
  openCart,
  toggleWishlist,
  closeWishlist,
  openWishlist,
  toggleMobileMenu,
  closeMobileMenu,
  openMobileMenu,
  toggleSearch,
  closeSearch,
  openSearch,
  toggleFilter,
  closeFilter,
  openFilter,
  closeAllModals,
  setProductView,
  toggleProductView,
  addToast,
  removeToast,
  clearToasts,
  setTheme,
  toggleTheme,
  toggleSidebar,
  setSidebarCollapsed,
  openVirtualTryOn,
  closeVirtualTryOn,
  toggleVirtualTryOn,
  setSearchSuggestions,
  clearSearchSuggestions,
  setSearchLoading,
  setActiveFilters,
  addActiveFilter,
  removeActiveFilter,
  clearActiveFilters,
  setCurrentPage,
  setGlobalError,
  clearGlobalError,
} = uiSlice.actions;

export default uiSlice.reducer;