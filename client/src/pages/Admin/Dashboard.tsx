import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  FiUsers,
  FiShoppingBag,
  FiPackage,
  FiTrendingUp,
  FiDollarSign,
  FiEye,
  FiAlertTriangle,
  FiMoreHorizontal,
} from 'react-icons/fi';
import { RootState } from '../../store';
import { addToast } from '../../store/slices/uiSlice';
import { getDashboardStats } from '../../services/api';

interface DashboardStats {
  overview: {
    totalUsers: number;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    newUsersThisMonth: number;
    ordersThisMonth: number;
    revenueThisMonth: number;
  };
  topProducts: Array<{
    productId: string;
    name: string;
    sales: number;
    product: any;
  }>;
  topCategories: Array<{
    _id: string;
    count: number;
  }>;
  recentOrders: Array<any>;
  lowStockProducts: Array<any>;
}

const AdminDashboard: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    fetchDashboardStats();
  }, [timeRange]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await getDashboardStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      dispatch(addToast({
        type: 'error',
        message: 'Failed to fetch dashboard stats',
      }));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const StatCard = ({ title, value, icon: Icon, change, changeType }: any) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${
              changeType === 'increase' ? 'text-green-600' : 'text-red-600'
            }`}>
              <FiTrendingUp className={`mr-1 h-4 w-4 ${changeType === 'decrease' ? 'rotate-180' : ''}`} />
              {change}% from last month
            </div>
          )}
        </div>
        <div className="p-3 bg-red-50 rounded-full">
          <Icon className="h-6 w-6 text-red-600" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-r-2 border-t-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex space-x-2">
            {(['week', 'month', 'year'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-md ${
                  timeRange === range
                    ? 'bg-red-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats.overview.totalUsers.toLocaleString()}
            icon={FiUsers}
            change={Math.round((stats.overview.newUsersThisMonth / stats.overview.totalUsers) * 100)}
            changeType="increase"
          />
          <StatCard
            title="Total Products"
            value={stats.overview.totalProducts.toLocaleString()}
            icon={FiPackage}
          />
          <StatCard
            title="Total Orders"
            value={stats.overview.totalOrders.toLocaleString()}
            icon={FiShoppingBag}
            change={Math.round((stats.overview.ordersThisMonth / stats.overview.totalOrders) * 100)}
            changeType="increase"
          />
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats.overview.totalRevenue)}
            icon={FiDollarSign}
            change={Math.round((stats.overview.revenueThisMonth / stats.overview.totalRevenue) * 100)}
            changeType="increase"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Products */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Top Products</h3>
            <div className="space-y-4">
              {stats.topProducts.slice(0, 5).map((product, index) => (
                <div key={product.productId} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center justify-center w-8 h-8 bg-red-50 text-red-600 rounded-full text-sm font-semibold">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.product?.brand}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{product.sales} sold</p>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(product.sales * (product.product?.price || 0))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Categories */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Top Categories</h3>
            <div className="space-y-4">
              {stats.topCategories.map((category, index) => (
                <div key={category._id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center justify-center w-8 h-8 bg-red-50 text-red-600 rounded-full text-sm font-semibold">
                      {index + 1}
                    </span>
                    <p className="font-medium text-gray-900">{category._id}</p>
                  </div>
                  <p className="font-semibold">{category.count} products</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Recent Orders</h3>
              <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                View All
              </button>
            </div>
            <div className="space-y-4">
              {stats.recentOrders.map((order) => (
                <div key={order._id} className="border-b border-gray-200 pb-4 last:border-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="text-sm text-gray-600">{order.userId?.name}</p>
                      <p className="text-sm text-gray-600">
                        {order.items?.length || 0} items • {formatCurrency(order.pricing?.total || 0)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Low Stock Alert */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Low Stock Alert</h3>
              {stats.lowStockProducts.length > 0 && (
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold">
                  {stats.lowStockProducts.length} items
                </span>
              )}
            </div>
            {stats.lowStockProducts.length > 0 ? (
              <div className="space-y-4">
                {stats.lowStockProducts.slice(0, 5).map((product) => (
                  <div key={product._id} className="flex items-center justify-between border-b border-gray-200 pb-4 last:border-0">
                    <div className="flex items-center space-x-3">
                      <FiAlertTriangle className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-600">{product.brand}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">
                        {product.variants?.reduce((sum: number, v: any) => sum + v.stock, 0)} left
                      </p>
                      <button className="text-sm text-blue-600 hover:text-blue-700">
                        Restock
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FiPackage className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2 text-gray-600">All products are well stocked</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="flex items-center justify-center space-x-2 p-4 bg-red-50 text-red-600 rounded-md hover:bg-red-100">
              <FiPackage className="h-5 w-5" />
              <span>Add Product</span>
            </button>
            <button className="flex items-center justify-center space-x-2 p-4 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100">
              <FiShoppingBag className="h-5 w-5" />
              <span>Manage Orders</span>
            </button>
            <button className="flex items-center justify-center space-x-2 p-4 bg-green-50 text-green-600 rounded-md hover:bg-green-100">
              <FiUsers className="h-5 w-5" />
              <span>View Users</span>
            </button>
            <button className="flex items-center justify-center space-x-2 p-4 bg-purple-50 text-purple-600 rounded-md hover:bg-purple-100">
              <FiMoreHorizontal className="h-5 w-5" />
              <span>More</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;