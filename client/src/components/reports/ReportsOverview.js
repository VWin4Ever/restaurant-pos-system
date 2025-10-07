import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const ReportsOverview = () => {
  const { user, loading } = useAuth();
  const [dateRange, setDateRange] = useState('today');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [quickStats, setQuickStats] = useState({
    todaySales: { total: 0, count: 0 },
    averageOrder: 0,
    pendingOrders: 0,
    availableTables: 0
  });

  const dateRangeOptions = useMemo(() => [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'week', label: 'This Week' },
    { value: 'lastWeek', label: 'Last Week' },
    { value: 'month', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'custom', label: 'Custom Range' }
  ], []);

  const fetchQuickStats = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (dateRange === 'custom') {
        params.append('startDate', customDateRange.startDate);
        params.append('endDate', customDateRange.endDate);
      } else {
        params.append('range', dateRange);
      }

      const response = await axios.get(`/api/reports/dashboard?${params}`);
      const data = response.data?.data || {};
      
      // Ensure all values are properly initialized
      setQuickStats({
        todaySales: {
          total: Number(data.todaySales?.total) || 0,
          count: Number(data.todaySales?.count) || 0
        },
        averageOrder: Number(data.averageOrder) || 0,
        pendingOrders: Number(data.pendingOrders) || 0,
        availableTables: Number(data.availableTables) || 0
      });
    } catch (error) {
      console.error('Failed to fetch quick stats:', error);
      // Reset to default values on error
      setQuickStats({
        todaySales: { total: 0, count: 0 },
        averageOrder: 0,
        pendingOrders: 0,
        availableTables: 0
      });
    }
  }, [dateRange, customDateRange]);

  // Fetch quick stats for overview
  useEffect(() => {
    fetchQuickStats();
  }, [fetchQuickStats]);

  const handleDateRangeChange = useCallback((value) => {
    setDateRange(value);
    if (value !== 'custom') {
      setCustomDateRange({ startDate: '', endDate: '' });
    }
  }, []);

  const handleCustomDateChange = useCallback((field, value) => {
    setCustomDateRange(prev => ({ ...prev, [field]: value }));
  }, []);

  const getDateRangeLabel = useCallback(() => {
    if (dateRange === 'custom' && customDateRange.startDate && customDateRange.endDate) {
      return `${customDateRange.startDate} to ${customDateRange.endDate}`;
    }
    const option = dateRangeOptions.find(opt => opt.value === dateRange);
    return option ? option.label : 'Today';
  }, [dateRange, customDateRange, dateRangeOptions]);

  // Show loading spinner while authentication is being checked
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect cashiers directly to sales reports
  if (user?.role === 'CASHIER') {
    return <Navigate to="/reports/sales" replace />;
  }

  // If no user is found, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports Overview</h1>
            <p className="text-gray-600 mt-2">
              Restaurant performance and business insights
            </p>
          </div>
          
          {/* Date Range Controls */}
          <div className="mt-4 lg:mt-0 flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Period:</label>
              <select
                value={dateRange}
                onChange={(e) => handleDateRangeChange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              >
                {dateRangeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {dateRange === 'custom' && (
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={customDateRange.startDate}
                  onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={customDateRange.endDate}
                  onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            )}

            <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
              Showing: <span className="font-medium">{getDateRangeLabel()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Revenue</p>
              <p className="text-3xl font-bold">
                ${quickStats.todaySales.total.toFixed(2)}
              </p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Orders</p>
              <p className="text-3xl font-bold">
                {quickStats.todaySales?.count || 0}
              </p>
            </div>
            <div className="text-4xl">📋</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Pending Orders</p>
              <p className="text-3xl font-bold">
                {quickStats.pendingOrders || 0}
              </p>
            </div>
            <div className="text-4xl">⏳</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Available Tables</p>
              <p className="text-3xl font-bold">
                {quickStats.availableTables || 0}
              </p>
            </div>
            <div className="text-4xl">🪑</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link 
            to="/reports/sales"
            className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <div className="text-2xl mb-2">📊</div>
            <div className="text-sm font-medium text-blue-900">Sales Report</div>
          </Link>
          <Link 
            to="/reports/inventory"
            className="p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            <div className="text-2xl mb-2">📦</div>
            <div className="text-sm font-medium text-red-900">Stock Alert</div>
          </Link>
          <Link 
            to="/reports/financial"
            className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <div className="text-2xl mb-2">💳</div>
            <div className="text-sm font-medium text-green-900">End of Day</div>
          </Link>
          <Link 
            to="/reports/staff"
            className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <div className="text-2xl mb-2">👥</div>
            <div className="text-sm font-medium text-orange-900">Staff Report</div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">New order received - Table 5</span>
            </div>
            <span className="text-xs text-gray-500">2 min ago</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Payment completed - $45.50</span>
            </div>
            <span className="text-xs text-gray-500">5 min ago</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Low stock alert - Coffee beans</span>
            </div>
            <span className="text-xs text-gray-500">10 min ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsOverview;
