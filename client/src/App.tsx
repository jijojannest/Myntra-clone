import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';

import { store } from './store';
import ProtectedRoute from './components/common/ProtectedRoute';
import PublicRoute from './components/common/PublicRoute';

// Layout components
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Page components
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import VirtualTryOn from './pages/VirtualTryOn';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Profile from './pages/Profile';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Admin from './pages/Admin';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<PublicRoute><MainLayout><Home /></MainLayout></PublicRoute>} />
            <Route path="/products" element={<PublicRoute><MainLayout><Products /></MainLayout></PublicRoute>} />
            <Route path="/products/:id" element={<PublicRoute><MainLayout><ProductDetail /></MainLayout></PublicRoute>} />
            <Route path="/virtual-try-on/:productId" element={<ProtectedRoute><MainLayout><VirtualTryOn /></MainLayout></ProtectedRoute>} />

            {/* Auth routes */}
            <Route path="/login" element={<PublicRoute><AuthLayout><Login /></AuthLayout></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><AuthLayout><Register /></AuthLayout></PublicRoute>} />

            {/* Protected routes */}
            <Route path="/profile" element={<ProtectedRoute><MainLayout><Profile /></MainLayout></ProtectedRoute>} />
            <Route path="/cart" element={<ProtectedRoute><MainLayout><Cart /></MainLayout></ProtectedRoute>} />
            <Route path="/wishlist" element={<ProtectedRoute><MainLayout><Wishlist /></MainLayout></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><MainLayout><Checkout /></MainLayout></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><MainLayout><Orders /></MainLayout></ProtectedRoute>} />

            {/* Admin routes */}
            <Route path="/admin/*" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          </Routes>

          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#374151',
                color: '#ffffff',
              },
              success: {
                duration: 3000,
                iconTheme: 'colored',
              },
              error: {
                duration: 5000,
                iconTheme: 'colored',
              },
            }}
          />
        </div>
      </Router>
    </Provider>
  );
}

export default App;
