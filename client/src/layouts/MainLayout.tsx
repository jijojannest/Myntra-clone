import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FiShoppingCart, FiHeart, FiUser, FiSearch, FiMenu } from 'react-icons/fi';

import { RootState } from '../../store';
import { toggleCart, toggleWishlist, toggleMobileMenu, toggleSearch } from '../../store/slices/uiSlice';

const MainLayout: React.FC = () => {
  const dispatch = useDispatch();
  const { cart, wishlist, user, ui } = useSelector((state: RootState) => state);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll for header styling
  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menuItems = [
    { name: 'Men', href: '/products?category=men' },
    { name: 'Women', href: '/products?category=women' },
    { name: 'Kids', href: '/products?category=kids' },
    { name: 'Home & Living', href: '/products?category=home' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className={`sticky top-0 z-50 bg-white transition-shadow ${
        isScrolled ? 'shadow-lg' : 'shadow-md'
      }`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-red-600">Myntra</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {menuItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {item.name}
                </a>
              ))}
            </nav>

            {/* Search Bar */}
            <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for products..."
                  className="w-full px-4 py-2 pr-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  onClick={() => dispatch(toggleSearch())}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-4">
              {/* Cart */}
              <button
                onClick={() => dispatch(toggleCart())}
                className="relative p-2 text-gray-600 hover:text-red-600 transition-colors"
              >
                <FiShoppingCart className="h-6 w-6" />
                {cart.totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cart.totalItems}
                  </span>
                )}
              </button>

              {/* Wishlist */}
              <button
                onClick={() => dispatch(toggleWishlist())}
                className="relative p-2 text-gray-600 hover:text-red-600 transition-colors"
              >
                <FiHeart className="h-6 w-6" />
                {wishlist.itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {wishlist.itemCount}
                  </span>
                )}
              </button>

              {/* User Profile */}
              {user.isAuthenticated ? (
                <button className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors">
                  <FiUser className="h-6 w-6" />
                  <span className="text-sm font-medium">{user.user?.firstName}</span>
                </button>
              ) : (
                <a
                  href="/login"
                  className="text-gray-600 hover:text-red-600 transition-colors"
                >
                  <FiUser className="h-6 w-6" />
                </a>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => dispatch(toggleMobileMenu())}
                className="md:hidden p-2 text-gray-600 hover:text-red-600 transition-colors"
              >
                <FiMenu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="/about" className="text-gray-400 hover:text-white">About Us</a></li>
                <li><a href="/careers" className="text-gray-400 hover:text-white">Careers</a></li>
                <li><a href="/press" className="text-gray-400 hover:text-white">Press</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Customer Service</h3>
              <ul className="space-y-2">
                <li><a href="/contact" className="text-gray-400 hover:text-white">Contact Us</a></li>
                <li><a href="/returns" className="text-gray-400 hover:text-white">Returns</a></li>
                <li><a href="/shipping" className="text-gray-400 hover:text-white">Shipping</a></li>
                <li><a href="/faq" className="text-gray-400 hover:text-white">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Connect</h3>
              <ul className="space-y-2">
                <li><a href="/facebook" className="text-gray-400 hover:text-white">Facebook</a></li>
                <li><a href="/instagram" className="text-gray-400 hover:text-white">Instagram</a></li>
                <li><a href="/twitter" className="text-gray-400 hover:text-white">Twitter</a></li>
                <li><a href="/youtube" className="text-gray-400 hover:text-white">YouTube</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Newsletter</h3>
              <p className="text-gray-400 mb-2">Subscribe to get special offers</p>
              <form className="flex">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-3 py-2 bg-gray-800 text-white rounded-l-md focus:outline-none focus:ring-2 focus:ring-white"
                />
                <button
                  type="submit"
                  className="ml-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-white"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2024 Myntra Clone. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;