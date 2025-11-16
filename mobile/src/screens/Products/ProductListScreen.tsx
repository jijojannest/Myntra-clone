import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  ScrollView,
  Animated,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FastImage from 'react-native-fast-image';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useApi, usePaginatedApi } from '../../hooks/useApi';
import { Product, FilterOption, SearchFilters } from '../../types';
import { setFilters, setSearchQuery } from '../../store/slices/productsSlice';
import { apiClient, endpoints } from '../../utils/api';
import { addToCart } from '../../services/cartService';
import { addToWishlist } from '../../services/wishlistService';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 40) / 2 - 10;
const ITEM_HEIGHT = ITEM_WIDTH * 1.4;

interface ProductListScreenProps {
  route?: {
    params?: {
      category?: string;
      subcategory?: string;
      brand?: string;
    };
  };
}

const ProductListScreen: React.FC<ProductListScreenProps> = ({ route }) => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { filters, searchQuery } = useSelector((state: any) => state.products);
  const { items: cartItems } = useSelector((state: any) => state.cart);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchQuery || '');
  const [sortBy, setSortBy] = useState('relevance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedFilters, setSelectedFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState<{
    categories: FilterOption[];
    brands: FilterOption[];
    sizes: FilterOption[];
    colors: FilterOption[];
    priceRanges: FilterOption[];
  }>({ categories: [], brands: [], sizes: [], colors: [], priceRanges: [] });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const flatListRef = useRef<FlatList>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Load filter options
  const { data: filterData } = useApi(
    () => apiClient.get('/products/filters'),
    [],
    { cacheKey: 'product_filters', cacheTTL: 30 * 60 * 1000 } // 30 minutes
  );

  // Load products
  const { data: productData, loadMore, refresh, pagination, refreshing: isLoadingMore } = usePaginatedApi(
    (page: number, limit: number) => apiClient.get(endpoints.PRODUCTS.LIST, {
      params: {
        page,
        limit,
        query: searchTerm || undefined,
        category: route.params?.category || selectedFilters.category || undefined,
        subcategory: route.params?.subcategory || selectedFilters.subcategory || undefined,
        brand: selectedFilters.brand || undefined,
        size: selectedFilters.size || undefined,
        color: selectedFilters.color || undefined,
        minPrice: selectedFilters.priceRange?.min,
        maxPrice: selectedFilters.priceRange?.max,
        sortBy,
        sortOrder,
      }
    }),
    [searchTerm, selectedFilters, sortBy, sortOrder, route.params]
  );

  useEffect(() => {
    if (filterData) {
      setFilterOptions(filterData);
    }
  }, [filterData]);

  useEffect(() => {
    if (productData) {
      setProducts(productData.items);
      setLoading(false);
    }
  }, [productData]);

  useFocusEffect(
    useCallback(() => {
      // Refresh data when screen comes into focus
      refresh();
    }, [refresh])
  );

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      dispatch(setSearchQuery(searchTerm));
    }, 500);
  }, [searchTerm, dispatch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && pagination.hasMore) {
      loadMore();
    }
  }, [isLoadingMore, pagination.hasMore, loadMore]);

  const handleSearch = useCallback((text: string) => {
    setSearchTerm(text);
  }, []);

  const handleSort = useCallback((sort: string) => {
    setSortBy(sort);
    refresh();
  }, [refresh]);

  const handleFilterPress = useCallback(() => {
    setShowFilters(!showFilters);
  }, [showFilters]);

  const handleFilterSelect = useCallback((filterType: keyof SearchFilters, value: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType] === value ? undefined : value,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedFilters({});
    dispatch(setFilters({}));
    refresh();
  }, [dispatch, refresh]);

  const applyFilters = useCallback(() => {
    dispatch(setFilters(selectedFilters));
    setShowFilters(false);
    refresh();
  }, [dispatch, selectedFilters, refresh]);

  const handleAddToCart = useCallback(async (product: Product, variant?: any) => {
    try {
      const defaultVariant = variant || product.variants[0];
      await addToCart({
        productId: product.id,
        variant: defaultVariant,
        quantity: 1,
      });

      Toast.show({
        type: 'success',
        text1: `${product.name} added to cart`,
        position: 'bottom',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to add to cart',
        position: 'bottom',
      });
    }
  }, []);

  const handleAddToWishlist = useCallback(async (product: Product) => {
    try {
      await addToWishlist({
        productId: product.id,
        variant: product.variants[0],
      });

      Toast.show({
        type: 'success',
        text1: `${product.name} added to wishlist`,
        position: 'bottom',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to add to wishlist',
        position: 'bottom',
      });
    }
  }, []);

  const handleProductPress = useCallback((product: Product) => {
    navigation.navigate('ProductDetail', { productId: product.id });
  }, [navigation]);

  const isInCart = useCallback((productId: string) => {
    return cartItems.some((item: any) => item.productId === productId);
  }, [cartItems]);

  const renderProductItem = useCallback(({ item }: { item: Product }) => {
    const effectivePrice = item.discountPrice || item.price;
    const discount = item.discountPrice ? Math.round(((item.price - item.discountPrice) / item.price) * 100) : 0;

    if (viewMode === 'list') {
      return (
        <TouchableOpacity
          style={styles.listItem}
          onPress={() => handleProductPress(item)}
          activeOpacity={0.8}
        >
          <FastImage
            source={{ uri: item.images[0] }}
            style={styles.listItemImage}
            resizeMode={FastImage.resizeMode.cover}
          />
          <View style={styles.listItemContent}>
            <View style={styles.listItemHeader}>
              <Text style={styles.brandText}>{item.brand}</Text>
              {discount > 0 && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{discount}% OFF</Text>
                </View>
              )}
            </View>
            <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.productDescription} numberOfLines={3}>{item.description}</Text>
            <View style={styles.listItemFooter}>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>₹{effectivePrice}</Text>
                {item.discountPrice && (
                  <Text style={styles.originalPrice}>₹{item.price}</Text>
                )}
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionButton, isInCart(item.id) && styles.inCartButton]}
                  onPress={() => handleAddToCart(item)}
                >
                  <Icon
                    name={isInCart(item.id) ? 'shopping-cart' : 'add-shopping-cart'}
                    size={20}
                    color={isInCart(item.id) ? '#fff' : '#E53935'}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleAddToWishlist(item)}
                >
                  <Icon name="favorite-border" size={20} color="#E53935" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={styles.gridItem}
        onPress={() => handleProductPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.gridItemContent}>
          <FastImage
            source={{ uri: item.images[0] }}
            style={styles.gridItemImage}
            resizeMode={FastImage.resizeMode.cover}
          />
          {discount > 0 && (
            <View style={styles.gridDiscountBadge}>
              <Text style={styles.discountText}>{discount}% OFF</Text>
            </View>
          )}
          <Text style={styles.gridBrandText}>{item.brand}</Text>
          <Text style={styles.gridProductName} numberOfLines={2}>{item.name}</Text>
          <View style={styles.gridPriceContainer}>
            <Text style={styles.price}>₹{effectivePrice}</Text>
            {item.discountPrice && (
              <Text style={styles.originalPrice}>₹{item.price}</Text>
            )}
          </View>
          <View style={styles.gridActions}>
            <TouchableOpacity
              style={[styles.gridActionButton, isInCart(item.id) && styles.inCartButton]}
              onPress={() => handleAddToCart(item)}
            >
              <Icon
                name={isInCart(item.id) ? 'shopping-cart' : 'add-shopping-cart'}
                size={16}
                color={isInCart(item.id) ? '#fff' : '#E53935'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.gridActionButton}
              onPress={() => handleAddToWishlist(item)}
            >
              <Icon name="favorite-border" size={16} color="#E53935" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [viewMode, handleProductPress, handleAddToCart, handleAddToWishlist, isInCart]);

  const renderHeader = useCallback(() => (
    <View style={styles.header}>
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchTerm}
          onChangeText={handleSearch}
          returnKeyType="search"
        />
      </View>
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
        >
          <Icon name={viewMode === 'grid' ? 'view-list' : 'view-grid'} size={24} color="#E53935" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleFilterPress}
        >
          <Icon name="filter-list" size={24} color="#E53935" />
        </TouchableOpacity>
      </View>
    </View>
  ), [searchTerm, viewMode, handleSearch, handleFilterPress]);

  const renderFooter = useCallback(() => {
    if (isLoadingMore) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator size="small" color="#E53935" />
        </View>
      );
    }

    if (!pagination.hasMore) {
      return (
        <View style={styles.footer}>
          <Text style={styles.footerText}>No more products</Text>
        </View>
      );
    }

    return null;
  }, [isLoadingMore, pagination.hasMore]);

  const keyExtractor = useCallback((item: Product) => item.id, []);

  const getItemLayout = useCallback((data: any, index: number) => ({
    length: viewMode === 'grid' ? ITEM_HEIGHT : 120,
    offset: viewMode === 'grid' ? ITEM_HEIGHT * index : 120 * index,
    index,
  }), [viewMode]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E53935" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}

      {/* Filter Modal would be implemented here */}

      <FlatList
        ref={flatListRef}
        data={products}
        renderItem={renderProductItem}
        keyExtractor={keyExtractor}
        numColumns={viewMode === 'grid' ? 2 : 1}
        getItemLayout={getItemLayout}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#E53935"
          />
        }
        ListHeaderComponent={
          <View style={styles.sortContainer}>
            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => handleSort('price_low_high')}
            >
              <Text style={styles.sortButtonText}>Price: Low to High</Text>
              <Icon name="arrow-drop-down" size={16} color="#666" />
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={viewMode === 'grid' ? styles.gridContent : styles.listContent}
      />

      {products.length === 0 && !loading && (
        <View style={styles.emptyContainer}>
          <Icon name="search-off" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No products found</Text>
          <Text style={styles.emptySubtext}>Try adjusting your filters or search terms</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    borderRadius: 6,
  },
  sortContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 6,
  },
  sortButtonText: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  gridContent: {
    paddingHorizontal: 10,
  },
  listContent: {
    paddingHorizontal: 10,
  },
  gridItem: {
    width: ITEM_WIDTH,
    margin: 5,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  gridItemContent: {
    flex: 1,
  },
  gridItemImage: {
    width: '100%',
    height: ITEM_WIDTH * 0.8,
  },
  gridDiscountBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#E53935',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  gridBrandText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  gridProductName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  gridPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridActionButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    padding: 8,
  },
  listItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  listItemImage: {
    width: 80,
    height: 80,
    borderRadius: 6,
    marginRight: 15,
  },
  listItemContent: {
    flex: 1,
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  brandText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
  },
  listItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E53935',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecoration: 'line-through',
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    padding: 10,
    marginLeft: 5,
  },
  inCartButton: {
    backgroundColor: '#E53935',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default ProductListScreen;