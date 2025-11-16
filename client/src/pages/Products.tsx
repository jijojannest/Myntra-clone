import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiFilter, FiGrid, FiList, FiHeart, FiShoppingBag } from 'react-icons/fi';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { fetchProducts, setFilters, setSorting, setCurrentPage } from '../store/slices/productsSlice';
import { addToast } from '../store/slices/uiSlice';

const Products: React.FC = () => {
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();

  const { products, pagination, filters, isLoading } = useSelector((state: RootState) => state.products);
  const { wishlist, cart } = useSelector((state: RootState) => state);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });

  // Parse URL params
  const category = searchParams.get('category');
  const brand = searchParams.get('brand');
  const search = searchParams.get('search');

  useEffect(() => {
    // Set initial filters from URL
    const initialFilters = {};
    if (category) initialFilters.category = category;
    if (brand) initialFilters.brand = brand;
    if (search) initialFilters.search = search;

    dispatch(setFilters(initialFilters));
  }, [dispatch, category, brand, search]);

  // Fetch products on mount and when filters change
  useEffect(() => {
    dispatch(fetchProducts({
      page: pagination.currentPage,
      limit: pagination.limit,
      ...filters,
      minPrice: filters.priceRange?.[0],
      maxPrice: filters.priceRange?.[1],
    }));
  }, [dispatch, pagination.currentPage, pagination.limit, filters]);

  const handleSearch = (query: string) => {
    dispatch(setFilters({ ...filters, search: query }));
    dispatch(setCurrentPage(1));
  };

  const handleFilterChange = (newFilters: any) => {
    dispatch(setFilters({ ...filters, ...newFilters }));
    dispatch(setCurrentPage(1));
  };

  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    dispatch(setSorting({ sortBy, sortOrder }));
    dispatch(setCurrentPage(1));
  };

  const handlePriceRange = (min: number, max: number) => {
    setPriceRange({ min, max });
    handleFilterChange({ priceRange: [min, max] });
  };

  const toggleWishlist = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Toggle wishlist logic would go here
    dispatch(addToast({
      type: 'success',
      message: 'Added to wishlist!'
    }));
  };

  const addToCart = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Add to cart logic would go here
    dispatch(addToast({
      type: 'success',
      message: 'Added to cart!'
    }));
  };

  const loadMoreProducts = () => {
    if (pagination.currentPage < pagination.totalPages) {
      dispatch(setCurrentPage(pagination.currentPage + 1));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {category ? `${category}` : 'All Products'}
        </h1>
        <p className="text-gray-600 mt-2">
          {products.length} products found
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search products..."
              value={filters.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* Sort */}
          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              handleSortChange(sortBy, sortOrder as 'asc' | 'desc');
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="popularity-desc">Most Popular</option>
            <option value="newest-desc">Newest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating-desc">Highest Rated</option>
            <option value="discount-desc">Best Discount</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center space-x-2 border-l pl-4">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-red-600 text-white' : 'text-gray-600 hover:text-red-600'}`}
            >
              <FiGrid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-red-600 text-white' : 'text-gray-600 hover:text-red-600'}`}
            >
              <FiList className="h-5 w-5" />
            </button>
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <FiFilter className="mr-2 h-5 w-5" />
            Filters
          </button>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => handleFilterChange({ inStock: true })}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm"
          >
            In Stock
          </button>
          <button
            onClick={() => handleFilterChange({ featured: true })}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm"
          >
            Featured
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Filter Products</h3>

          {/* Price Range */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price Range (₹)
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="number"
                placeholder="Min"
                value={priceRange.min}
                onChange={(e) => handlePriceRange(Number(e.target.value), priceRange.max)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <span className="text-gray-500">-</span>
              <input
                type="number"
                placeholder="Max"
                value={priceRange.max}
                onChange={(e) => handlePriceRange(priceRange.min, Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {['Men', 'Women', 'Kids', 'Home & Living'].map(cat => (
                <label key={cat} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.category === cat}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleFilterChange({ category: cat });
                      } else if (filters.category === cat) {
                        handleFilterChange({ category: undefined });
                      }
                    }}
                    className="mr-2"
                  />
                  {cat}
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={() => handleFilterChange({})}
            className="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Products Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-r-2 border-t-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        </div>
      ) : (
        <>
          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No products found matching your criteria.</p>
              <button
                onClick={() => handleFilterChange({})}
                className="mt-4 px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className={`grid gap-6 ${
                viewMode === 'grid'
                  ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                  : 'grid-cols-1'
              }`}>
                {products.map(product => (
                  <div
                    key={product._id}
                    className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow ${
                      viewMode === 'list' ? 'flex' : ''
                    }`}
                  >
                    <div className={viewMode === 'list' ? 'w-48 h-48 flex-shrink-0' : ''}>
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className={`w-full h-full object-cover ${
                          viewMode === 'grid' ? 'h-64' : ''
                        }`}
                      />
                    </div>

                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                          {product.name}
                        </h3>
                        <button
                          onClick={(e) => toggleWishlist(product._id, e)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <FiHeart className="h-5 w-5" />
                        </button>
                      </div>

                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                        {product.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl font-bold text-red-600">
                              ₹{product.discountPrice || product.price}
                            </span>
                            {product.discountPrice && (
                              <span className="text-lg text-gray-500 line-through">
                                ₹{product.price}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.brand}
                          </div>
                        </div>

                        <button
                          onClick={(e) => addToCart(product._id, e)}
                          className="p-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        >
                          <FiShoppingBag className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Product Actions */}
                      <div className="flex space-x-2 mt-3">
                        <button
                          onClick={() => window.location.href = `/products/${product._id}`}
                          className="flex-1 px-3 py-2 border border-red-600 text-red-600 rounded-md hover:bg-red-50 text-sm font-medium transition-colors"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => window.location.href = `/virtual-try-on/${product._id}`}
                          className="flex-1 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium transition-colors"
                        >
                          Try On
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More */}
              {pagination.currentPage < pagination.totalPages && (
                <div className="text-center mt-8">
                  <button
                    onClick={loadMoreProducts}
                    disabled={isLoading}
                    className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {isLoading ? 'Loading...' : 'Load More Products'}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Products;