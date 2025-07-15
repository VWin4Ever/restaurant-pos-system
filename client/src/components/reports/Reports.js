import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';

const Reports = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [orderStats, setOrderStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('today');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchReportsData();
  }, [dateRange]);

  const fetchReportsData = async () => {
    try {
      const [dashboardRes, salesRes, productsRes, ordersRes, statsRes] = await Promise.all([
        axios.get(`/api/reports/dashboard?range=${dateRange}`),
        axios.get(`/api/reports/sales?range=${dateRange}`),
        axios.get(`/api/reports/top-products?range=${dateRange}`),
        axios.get(`/api/orders?status=COMPLETED&limit=10`),
        axios.get(`/api/reports/order-stats?startDate=${getStartDate()}&endDate=${getEndDate()}`)
      ]);
      
      setDashboardData(dashboardRes.data.data);
      setSalesData(salesRes.data.data);
      setTopProducts(productsRes.data.data);
      setRecentOrders(ordersRes.data.data);
      setOrderStats(statsRes.data.data);
    } catch (error) {
      console.error('Failed to fetch reports data:', error);
      toast.error('Failed to load reports data');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    setExporting(true);
    try {
      const response = await axios.get(`/api/reports/export?range=${dateRange}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sales-report-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Report exported successfully!');
    } catch (error) {
      console.error('Failed to export report:', error);
      toast.error('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getDateRangeLabel = (range) => {
    const labels = {
      today: 'Today',
      week: 'This Week',
      month: 'This Month',
      year: 'This Year'
    };
    return labels[range] || range;
  };

  const getStartDate = () => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        return new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()).toISOString();
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      case 'year':
        return new Date(now.getFullYear(), 0, 1).toISOString();
      default:
        return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    }
  };

  const getEndDate = () => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
      case 'week':
        const weekEnd = new Date(now);
        weekEnd.setDate(now.getDate() - now.getDay() + 6);
        return new Date(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate(), 23, 59, 59).toISOString();
      case 'month':
        return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
      case 'year':
        return new Date(now.getFullYear(), 11, 31, 23, 59, 59).toISOString();
      default:
        return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <div className="flex space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <button
            onClick={exportReport}
            disabled={exporting}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Exporting...
              </div>
            ) : (
              'Export Report'
            )}
          </button>
        </div>
      </div>

      {/* Date Range Display */}
      <div className="text-sm text-gray-600">
        Showing data for: <span className="font-medium">{getDateRangeLabel(dateRange)}</span>
      </div>

      {/* Key Metrics */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-lg bg-green-100">
                <span className="text-2xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(dashboardData.todaySales?.total || 0)}
                </p>
                <p className="text-sm text-gray-500">
                  {dashboardData.todaySales?.count || 0} orders
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-lg bg-blue-100">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Order</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(dashboardData.averageOrder || 0)}
                </p>
                <p className="text-sm text-gray-500">per order</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-lg bg-yellow-100">
                <span className="text-2xl">⏳</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {dashboardData.pendingOrders || 0}
                </p>
                <p className="text-sm text-gray-500">awaiting payment</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-lg bg-purple-100">
                <span className="text-2xl">🪑</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Tables</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {dashboardData.availableTables || 0}
                </p>
                <p className="text-sm text-gray-500">ready for customers</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Statistics */}
      {orderStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-lg bg-indigo-100">
                <span className="text-2xl">📋</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {orderStats.totalOrders || 0}
                </p>
                <p className="text-sm text-gray-500">all time</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-lg bg-green-100">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {orderStats.byStatus?.find(s => s.status === 'COMPLETED')?._count || 0}
                </p>
                <p className="text-sm text-gray-500">orders</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-lg bg-red-100">
                <span className="text-2xl">❌</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Cancelled</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {orderStats.byStatus?.find(s => s.status === 'CANCELLED')?._count || 0}
                </p>
                <p className="text-sm text-gray-500">orders</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Sales Overview</h3>
          </div>
          <div className="p-6">
            {salesData.length > 0 ? (
              <div className="space-y-4">
                {salesData.map((sale) => (
                  <div key={sale.date} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{sale.date}</p>
                      <p className="text-sm text-gray-500">{sale.orders} orders</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(sale.total)}</p>
                      <p className="text-sm text-gray-500">{formatCurrency(sale.average)} avg</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No sales data available for this period</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Top Selling Products</h3>
          </div>
          <div className="p-6">
            {topProducts.length > 0 ? (
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={product.id} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-800 text-xs font-medium flex items-center justify-center mr-3">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">{product.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{product.quantity} sold</p>
                      <p className="text-sm text-gray-500">{formatCurrency(product.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No product data available for this period</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Sales Table */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Sales</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Table
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => {
                  const itemCount = order.orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Table {order.table?.number || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {itemCount} items
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.paymentMethod === 'CASH' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {order.paymentMethod || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <div className="text-lg font-medium mb-2">No recent orders</div>
                      <div className="text-sm">No completed orders found for this period.</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports; 