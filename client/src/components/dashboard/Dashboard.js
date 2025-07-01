import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (isAdmin) {
          const response = await axios.get('/api/reports/dashboard');
          setDashboardData(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAdmin]);

  if (loading) {
    return <LoadingSpinner />;
  }

  const StatCard = ({ title, value, subtitle, icon, color = 'primary' }) => (
    <div className="card p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-lg bg-${color}-100`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="card p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-gray-600 mt-2">
          {isAdmin ? 'Here\'s what\'s happening in your restaurant today.' : 'Ready to take orders and serve customers.'}
        </p>
      </div>

      {/* Admin Dashboard */}
      {isAdmin && dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Today's Sales"
            value={formatCurrency(dashboardData.todaySales?.total || 0)}
            subtitle={`${dashboardData.todaySales?.count || 0} orders`}
            icon="💰"
            color="success"
          />
          <StatCard
            title="Average Order"
            value={formatCurrency(dashboardData.averageOrder || 0)}
            subtitle="per order"
            icon="📊"
            color="primary"
          />
          <StatCard
            title="Pending Orders"
            value={dashboardData.pendingOrders || 0}
            subtitle="Awaiting payment"
            icon="⏳"
            color="warning"
          />
          <StatCard
            title="Available Tables"
            value={dashboardData.availableTables || 0}
            subtitle="Ready for customers"
            icon="🪑"
            color="success"
          />
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <a
              href="/orders"
              className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-xl mr-3">🛒</span>
              <div>
                <p className="font-medium text-gray-900">Create New Order</p>
                <p className="text-sm text-gray-600">Start taking orders</p>
              </div>
            </a>
            <a
              href="/tables"
              className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-xl mr-3">🪑</span>
              <div>
                <p className="font-medium text-gray-900">Manage Tables</p>
                <p className="text-sm text-gray-600">View table status</p>
              </div>
            </a>
            {isAdmin && (
              <>
                <a
                  href="/products"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-xl mr-3">📦</span>
                  <div>
                    <p className="font-medium text-gray-900">Manage Products</p>
                    <p className="text-sm text-gray-600">Add or edit menu items</p>
                  </div>
                </a>
                <a
                  href="/stock"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-xl mr-3">📦</span>
                  <div>
                    <p className="font-medium text-gray-900">Stock Management</p>
                    <p className="text-sm text-gray-600">Manage inventory</p>
                  </div>
                </a>
                <a
                  href="/reports"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-xl mr-3">📊</span>
                  <div>
                    <p className="font-medium text-gray-900">View Reports</p>
                    <p className="text-sm text-gray-600">Sales and analytics</p>
                  </div>
                </a>
              </>
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Database</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Online
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Server</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Online
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Printer</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Ready
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 