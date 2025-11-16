import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FiHeart, FiShoppingBag, FiShare2, FiTrash2, FiEdit2, FiX, FiCopy } from 'react-icons/fi';
import { RootState } from '../store';
import { addToast } from '../store/slices/uiSlice';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  updateWishlistItem,
  moveWishlistToCart,
  clearWishlist,
  shareWishlist,
} from '../services/api';

const Wishlist: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const [wishlist, setWishlist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareLink, setShareLink] = useState('');

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const response = await getWishlist();
      if (response.success) {
        setWishlist(response.data);
      }
    } catch (error) {
      dispatch(addToast({
        type: 'error',
        message: 'Failed to fetch wishlist',
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (productId: string) => {
    try {
      const response = await removeFromWishlist(productId);
      if (response.success) {
        dispatch(addToast({
          type: 'success',
          message: 'Item removed from wishlist',
        }));
        fetchWishlist();
      }
    } catch (error) {
      dispatch(addToast({
        type: 'error',
        message: 'Failed to remove item',
      }));
    }
  };

  const handleMoveToCart = async (productId: string) => {
    try {
      const response = await moveWishlistToCart(productId, { quantity: 1 });
      if (response.success) {
        dispatch(addToast({
          type: 'success',
          message: 'Item moved to cart',
        }));
        fetchWishlist();
      }
    } catch (error) {
      dispatch(addToast({
        type: 'error',
        message: 'Failed to move item to cart',
      }));
    }
  };

  const handleUpdateItem = async (productId: string, updates: { size?: string; color?: string }) => {
    try {
      const response = await updateWishlistItem(productId, updates);
      if (response.success) {
        dispatch(addToast({
          type: 'success',
          message: 'Item updated',
        }));
        fetchWishlist();
        setEditingItem(null);
      }
    } catch (error) {
      dispatch(addToast({
        type: 'error',
        message: 'Failed to update item',
      }));
    }
  };

  const handleBulkMoveToCart = async () => {
    try {
      const promises = Array.from(selectedItems).map(productId =>
        moveWishlistToCart(productId, { quantity: 1 })
      );
      await Promise.all(promises);

      dispatch(addToast({
        type: 'success',
        message: `${selectedItems.size} items moved to cart`,
      }));
      setSelectedItems(new Set());
      fetchWishlist();
    } catch (error) {
      dispatch(addToast({
        type: 'error',
        message: 'Failed to move items to cart',
      }));
    }
  };

  const handleBulkRemove = async () => {
    try {
      const promises = Array.from(selectedItems).map(productId =>
        removeFromWishlist(productId)
      );
      await Promise.all(promises);

      dispatch(addToast({
        type: 'success',
        message: `${selectedItems.size} items removed`,
      }));
      setSelectedItems(new Set());
      fetchWishlist();
    } catch (error) {
      dispatch(addToast({
        type: 'error',
        message: 'Failed to remove items',
      }));
    }
  };

  const handleClearWishlist = async () => {
    if (window.confirm('Are you sure you want to clear your entire wishlist?')) {
      try {
        const response = await clearWishlist();
        if (response.success) {
          dispatch(addToast({
            type: 'success',
            message: 'Wishlist cleared',
          }));
          fetchWishlist();
        }
      } catch (error) {
        dispatch(addToast({
          type: 'error',
          message: 'Failed to clear wishlist',
        }));
      }
    }
  };

  const handleShareWishlist = async () => {
    try {
      const response = await shareWishlist();
      if (response.success) {
        setShareLink(response.data.shareLink);
        setShareModalOpen(true);
      }
    } catch (error) {
      dispatch(addToast({
        type: 'error',
        message: 'Failed to generate share link',
      }));
    }
  };

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      dispatch(addToast({
        type: 'success',
        message: 'Link copied to clipboard',
      }));
    } catch (error) {
      dispatch(addToast({
        type: 'error',
        message: 'Failed to copy link',
      }));
    }
  };

  const toggleItemSelection = (productId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === wishlist?.items?.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(wishlist?.items?.map((item: any) => item.productId._id) || []));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-r-2 border-t-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
          <div className="flex space-x-4">
            <button
              onClick={handleShareWishlist}
              disabled={!wishlist?.items?.length}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              <FiShare2 className="mr-2" />
              Share
            </button>
            <button
              onClick={handleClearWishlist}
              disabled={!wishlist?.items?.length}
              className="px-4 py-2 text-red-600 border border-red-600 rounded-md hover:bg-red-50 disabled:opacity-50"
            >
              Clear All
            </button>
          </div>
        </div>

        {!wishlist?.items?.length ? (
          <div className="text-center py-12">
            <FiHeart className="mx-auto h-24 w-24 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Your wishlist is empty</h3>
            <p className="mt-2 text-gray-600">Save items you love for later</p>
            <button
              onClick={() => window.location.href = '/products'}
              className="mt-6 px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            {/* Bulk Actions */}
            {wishlist.items.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedItems.size === wishlist.items.length}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      {selectedItems.size > 0 && `${selectedItems.size} selected`}
                    </span>
                  </div>
                  {selectedItems.size > 0 && (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleBulkMoveToCart}
                        className="flex items-center px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                      >
                        <FiShoppingBag className="mr-1" />
                        Move to Cart
                      </button>
                      <button
                        onClick={handleBulkRemove}
                        className="flex items-center px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                      >
                        <FiTrash2 className="mr-1" />
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Wishlist Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlist.items.map((item: any) => (
                <div key={item.productId._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Selection Checkbox */}
                  <div className="absolute top-2 left-2 z-10">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.productId._id)}
                      onChange={() => toggleItemSelection(item.productId._id)}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                  </div>

                  {/* Product Image */}
                  <div className="relative">
                    <img
                      src={item.productId.images[0]}
                      alt={item.productId.name}
                      className="w-full h-64 object-cover"
                    />
                    {item.productId.discountPrice && (
                      <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-md text-sm font-semibold">
                        {Math.round(((item.productId.price - item.productId.discountPrice) / item.productId.price) * 100)}% OFF
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    {/* Product Name */}
                    <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                      {item.productId.name}
                    </h3>

                    {/* Brand */}
                    <p className="text-sm text-gray-600 mb-2">{item.productId.brand}</p>

                    {/* Size and Color */}
                    {editingItem === item.productId._id ? (
                      <div className="flex space-x-2 mb-3">
                        <select
                          value={item.size}
                          onChange={(e) => handleUpdateItem(item.productId._id, { size: e.target.value })}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
                            <option key={size} value={size}>{size}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={item.color}
                          onChange={(e) => handleUpdateItem(item.productId._id, { color: e.target.value })}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Color"
                        />
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600 mb-3">
                        Size: {item.size} • Color: {item.color}
                      </div>
                    )}

                    {/* Price */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl font-bold text-red-600">
                            ₹{item.productId.discountPrice || item.productId.price}
                          </span>
                          {item.productId.discountPrice && (
                            <span className="text-lg text-gray-500 line-through">
                              ₹{item.productId.price}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleMoveToCart(item.productId._id)}
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                      >
                        <FiShoppingBag className="mr-1" />
                        Add to Cart
                      </button>
                      <button
                        onClick={() => setEditingItem(editingItem === item.productId._id ? null : item.productId._id)}
                        className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        <FiEdit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveItem(item.productId._id)}
                        className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Share Modal */}
        {shareModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Share Your Wishlist</h3>
                <button
                  onClick={() => setShareModalOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Share Link
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={shareLink}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                    <button
                      onClick={handleCopyShareLink}
                      className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      <FiCopy className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Share this link with friends to show them your wishlist items.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;