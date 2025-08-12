import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const SummaryReports = React.memo(({ dateRange, customDateRange }) => {
  const [activeReport, setActiveReport] = useState('weekly-monthly');
  const [data, setData] = useState({});
  const [loading, setLocalLoading] = useState(false);

  const reports = [
    { id: 'weekly-monthly', name: 'Weekly/Monthly Sales Summary', icon: '📈' },
    { id: 'top-items', name: 'Top 10 Items Sold', icon: '🏆' },
    { id: 'slow-moving', name: 'Slow-Moving Items', icon: '🐌' },
    { id: 'orders-revenue', name: 'Total Orders vs Revenue', icon: '📊' }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchReportData();
    }, 300); // Debounce API calls by 300ms

    return () => clearTimeout(timeoutId);
  }, [activeReport, dateRange, customDateRange.startDate, customDateRange.endDate]);

  const fetchReportData = useCallback(async () => {
    const startTime = Date.now();
    const minLoadingTime = 500; // Minimum 500ms loading time to prevent blinking
    
    setLocalLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateRange === 'custom') {
        params.append('startDate', customDateRange.startDate);
        params.append('endDate', customDateRange.endDate);
      } else {
        params.append('range', dateRange);
      }

      const response = await axios.get(`/api/reports/summary/${activeReport}?${params}`);
      setData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch report data:', error);
      toast.error('Failed to load report data');
    } finally {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
      
      setTimeout(() => {
        setLocalLoading(false);
      }, remainingTime);
    }
  }, [activeReport, dateRange, customDateRange.startDate, customDateRange.endDate]);

  const exportReport = useCallback(async (format = 'csv') => {
    try {
      // Show loading state
      toast.info('Preparing export...');
      
      const params = new URLSearchParams();
      if (dateRange === 'custom') {
        params.append('startDate', customDateRange.startDate);
        params.append('endDate', customDateRange.endDate);
      } else {
        params.append('range', dateRange);
      }
      params.append('format', format);

      const response = await axios.get(`/api/reports/summary/${activeReport}/export?${params}`, {
        responseType: 'blob'
      });
      
      // Validate response
      if (!response.data || response.data.size === 0) {
        toast.error('No data available for export');
        return;
      }
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeReport}-${dateRange}-${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Clean up URL object
      window.URL.revokeObjectURL(url);
      
      toast.success(`Report exported successfully as ${format.toUpperCase()}!`);
    } catch (error) {
      console.error('Failed to export report:', error);
      if (error.response?.status === 404) {
        toast.error('Export feature not available for this report');
      } else if (error.response?.status === 500) {
        toast.error('Server error occurred during export');
      } else {
        toast.error('Failed to export report. Please try again.');
      }
    }
  }, [activeReport, dateRange, customDateRange.startDate, customDateRange.endDate]);

  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }, []);

  const renderWeeklyMonthly = () => (
    <div className="space-y-6">
      {/* Sales Summary */}
      {data.salesSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-green-50 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(data.salesSummary.totalRevenue || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">📋</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Total Orders</p>
                <p className="text-2xl font-bold text-blue-900">
                  {data.salesSummary.totalOrders || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">Avg Order Value</p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatCurrency(data.salesSummary.averageOrderValue || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <span className="text-2xl">📈</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-600">Growth Rate</p>
                <p className="text-2xl font-bold text-orange-900">
                  {data.salesSummary.growthRate || 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sales Trend Chart */}
      {data.salesTrend && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Sales Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.salesTrend}>
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} name="Revenue" />
              <Line type="monotone" dataKey="orders" stroke="#82ca9d" strokeWidth={2} name="Orders" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Sales by Category */}
      {data.salesByCategory && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Sales by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.salesByCategory}>
              <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Sales Details */}
      {data.salesDetails && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Sales Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Growth</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.salesDetails?.map((period) => (
                  <tr key={period.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {period.period}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(period.revenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {period.orders}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(period.averageOrder)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        period.growth >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {period.growth >= 0 ? '+' : ''}{period.growth}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderTopItems = () => (
    <div className="space-y-6">
      {/* Top Items Summary */}
      {data.topItemsSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-green-50 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">🏆</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Top Item</p>
                <p className="text-2xl font-bold text-green-900">
                  {data.topItemsSummary.topItem || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">📦</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Total Sold</p>
                <p className="text-2xl font-bold text-blue-900">
                  {data.topItemsSummary.totalSold || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-2xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">Total Revenue</p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatCurrency(data.topItemsSummary.totalRevenue || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-600">Avg Price</p>
                <p className="text-2xl font-bold text-orange-900">
                  {formatCurrency(data.topItemsSummary.averagePrice || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Items Chart */}
      {data.topItemsChart && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top 10 Items by Sales</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data.topItemsChart}>
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Items Details */}
      {data.topItemsDetails && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Top 10 Items Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity Sold</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Price</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.topItemsDetails?.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.quantitySold}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(item.revenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(item.averagePrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderSlowMoving = () => (
    <div className="space-y-6">
      {/* Slow Moving Summary */}
      {data.slowMovingSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-red-50 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <span className="text-2xl">🐌</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-red-600">Slow Items</p>
                <p className="text-2xl font-bold text-red-900">
                  {data.slowMovingSummary.slowItems || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <span className="text-2xl">📦</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-600">Stock Value</p>
                <p className="text-2xl font-bold text-orange-900">
                  {formatCurrency(data.slowMovingSummary.stockValue || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Avg Days</p>
                <p className="text-2xl font-bold text-blue-900">
                  {data.slowMovingSummary.averageDays || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">Risk Level</p>
                <p className="text-2xl font-bold text-purple-900">
                  {data.slowMovingSummary.riskLevel || 'Low'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slow Moving Chart */}
      {data.slowMovingChart && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Slow Moving Items by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.slowMovingChart}>
              <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#ef4444" name="Slow Items" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Slow Moving Details */}
      {data.slowMovingDetails && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Slow Moving Items Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Sold</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Since Sale</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Level</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.slowMovingDetails?.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.currentStock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.lastSold ? new Date(item.lastSold).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.daysSinceSale}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(item.stockValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.riskLevel === 'High' ? 'bg-red-100 text-red-800' :
                        item.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {item.riskLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderOrdersRevenue = () => (
    <div className="space-y-6">
      {/* Orders vs Revenue Summary */}
      {data.ordersRevenueSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-green-50 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">📋</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Total Orders</p>
                <p className="text-2xl font-bold text-green-900">
                  {data.ordersRevenueSummary.totalOrders || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Total Revenue</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(data.ordersRevenueSummary.totalRevenue || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">Avg Order Value</p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatCurrency(data.ordersRevenueSummary.averageOrderValue || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <span className="text-2xl">📈</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-orange-900">
                  {data.ordersRevenueSummary.conversionRate || 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders vs Revenue Chart */}
      {data.ordersRevenueChart && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Orders vs Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.ordersRevenueChart}>
              <XAxis dataKey="period" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip formatter={(value, name) => [
                name === 'revenue' ? formatCurrency(value) : value,
                name === 'revenue' ? 'Revenue' : 'Orders'
              ]} />
              <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#8884d8" strokeWidth={2} name="Orders" />
              <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#82ca9d" strokeWidth={2} name="Revenue" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Orders vs Revenue Details */}
      {data.ordersRevenueDetails && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Orders vs Revenue Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Growth</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.ordersRevenueDetails?.map((period) => (
                  <tr key={period.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {period.period}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {period.orders}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(period.revenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(period.averageOrder)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        period.growth >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {period.growth >= 0 ? '+' : ''}{period.growth}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderEmptyState = () => (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">📊</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
      <p className="text-gray-500 mb-4">
        There's no data to display for the selected date range and report type.
      </p>
      <div className="text-sm text-gray-400">
        Try selecting a different date range or report type.
      </div>
    </div>
  );

  const renderReportContent = () => {
    // Check if data is empty
    const hasData = Object.keys(data).length > 0 && 
                   Object.values(data).some(value => 
                     Array.isArray(value) ? value.length > 0 : 
                     typeof value === 'object' ? Object.keys(value || {}).length > 0 : 
                     value !== null && value !== undefined && value !== 0
                   );

    if (!loading && !hasData) {
      return renderEmptyState();
    }

    switch (activeReport) {
      case 'weekly-monthly':
        return renderWeeklyMonthly();
      case 'top-items':
        return renderTopItems();
      case 'slow-moving':
        return renderSlowMoving();
      case 'orders-revenue':
        return renderOrdersRevenue();
      default:
        return renderWeeklyMonthly();
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Type Selection */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-2">
          {reports.map((report) => (
            <button
              key={report.id}
              onClick={() => setActiveReport(report.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 ${
                activeReport === report.id
                  ? 'bg-primary-100 text-primary-700 border-2 border-primary-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
              }`}
            >
              <span>{report.icon}</span>
              <span>{report.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Export Controls */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={() => exportReport('csv')}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
        >
          Export CSV
        </button>
        <button
          onClick={() => exportReport('pdf')}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
        >
          Export PDF
        </button>
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        renderReportContent()
      )}
    </div>
  );
});

export default SummaryReports; 