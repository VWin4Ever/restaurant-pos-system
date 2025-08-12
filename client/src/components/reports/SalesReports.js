import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import ReportsFilter from './ReportsFilter';

const SalesReports = () => {
  const [activeReport, setActiveReport] = useState('summary');
  const [data, setData] = useState({});
  const [loading, setLocalLoading] = useState(false);
  const [dateRange, setDateRange] = useState('today');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // Restaurant-focused sales reports
  const reports = [
    { id: 'summary', name: 'Sales Summary', icon: '📊', description: 'Daily revenue and order overview' },
    { id: 'menu-performance', name: 'Menu Performance', icon: '🍽️', description: 'Best and worst selling items' },
    { id: 'peak-hours', name: 'Peak Hours', icon: '⏰', description: 'Busiest times and patterns' },
    { id: 'table-performance', name: 'Table Performance', icon: '🪑', description: 'Revenue by table analysis' },
    { id: 'category-sales', name: 'Category Sales', icon: '🍺', description: 'Performance by menu categories' },
    { id: 'discounts', name: 'Discounts', icon: '🎫', description: 'Discount impact on revenue' }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchReportData();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [activeReport, dateRange, customDateRange.startDate, customDateRange.endDate]);

  const fetchReportData = useCallback(async () => {
    const startTime = Date.now();
    const minLoadingTime = 500;
    
    setLocalLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateRange === 'custom') {
        params.append('startDate', customDateRange.startDate);
        params.append('endDate', customDateRange.endDate);
      } else {
        params.append('range', dateRange);
      }

      const response = await axios.get(`/api/reports/sales/${activeReport}?${params}`);
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
      toast.info('Preparing export...');
      
      const params = new URLSearchParams();
      if (dateRange === 'custom') {
        params.append('startDate', customDateRange.startDate);
        params.append('endDate', customDateRange.endDate);
      } else {
        params.append('range', dateRange);
      }
      params.append('format', format);

      const response = await axios.get(`/api/reports/sales/${activeReport}/export?${params}`, {
        responseType: 'blob'
      });
      
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
      
      window.URL.revokeObjectURL(url);
      
      toast.success(`Report exported successfully as ${format.toUpperCase()}!`);
    } catch (error) {
      console.error('Failed to export report:', error);
      toast.error('Failed to export report. Please try again.');
    }
  }, [activeReport, dateRange, customDateRange.startDate, customDateRange.endDate]);

  const handleDateRangeChange = useCallback((value) => {
    setDateRange(value);
    if (value !== 'custom') {
      setCustomDateRange({ startDate: '', endDate: '' });
    }
  }, []);

  const handleCustomDateChange = useCallback((field, value) => {
    setCustomDateRange(prev => ({ ...prev, [field]: value }));
  }, []);

  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }, []);

  const renderSalesSummary = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Revenue</p>
              <p className="text-3xl font-bold">
                {formatCurrency(data.totalRevenue || 0)}
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
                {data.totalOrders || 0}
              </p>
            </div>
            <div className="text-4xl">📋</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Items Sold</p>
              <p className="text-3xl font-bold">
                {data.totalItems || 0}
              </p>
            </div>
            <div className="text-4xl">🍽️</div>
          </div>
        </div>

        <div className="bg-orange-50 p-6 rounded-xl">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-orange-600">Avg Order</p>
              <p className="text-2xl font-bold text-orange-900">
                {formatCurrency(data.averageOrder || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Chart */}
      {data.dailySales && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.dailySales}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );

  const renderMenuPerformance = () => (
    <div className="space-y-6">
      {/* Top Items Chart */}
      {data.topItems && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Items</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data.topItems}>
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="revenue" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Items Table */}
      {data.items && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Menu Performance Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity Sold</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Price</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.items?.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.quantity}
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

  const renderPeakHours = () => (
    <div className="space-y-6">
      {/* Peak Hours Summary */}
      {data.peakHours && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-red-50 p-6 rounded-xl">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <span className="text-2xl">🔥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-red-600">Peak Hours</p>
                <p className="text-2xl font-bold text-red-900">
                  {data.peakHours.peak || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-xl">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Avg Hourly Revenue</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(data.peakHours.average || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 p-6 rounded-xl">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <span className="text-2xl">⏰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-600">Slow Hours</p>
                <p className="text-2xl font-bold text-orange-900">
                  {data.peakHours.slow || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hourly Chart */}
      {data.hourlySales && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hourly Sales Pattern</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.hourlySales}>
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="revenue" fill="#FFBB28" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );

  const renderTablePerformance = () => (
    <div className="space-y-6">
      {/* Table Performance Chart */}
      {data.tableSales && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Table</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.tableSales}>
              <XAxis dataKey="tableNumber" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="revenue" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table Details */}
      {data.tableDetails && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Table Performance Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Table</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilization</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.tableDetails?.map((table) => (
                  <tr key={table.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Table {table.number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {table.orderCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(table.revenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(table.averageOrder)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {table.utilization}%
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

  const renderCategorySales = () => (
    <div className="space-y-6">
      {/* Category Chart */}
      {data.categorySales && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.categorySales}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {data.categorySales.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h3>
            <div className="space-y-4">
              {data.categorySales?.map((category, index) => (
                <div key={category.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded mr-3"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(category.revenue)}</div>
                    <div className="text-sm text-gray-500">{category.quantity} items</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderDiscounts = () => (
    <div className="space-y-6">
              {/* Discount Summary */}
        {data.discountSummary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-xl shadow-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Discounts</p>
                  <p className="text-3xl font-bold">
                    {data.discountSummary.totalDiscounts || 0}
                  </p>
                </div>
                <div className="text-4xl">🎫</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Amount</p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(data.discountSummary.totalAmount || 0)}
                  </p>
                </div>
                <div className="text-4xl">💰</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Avg Discount</p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(data.discountSummary.averageDiscount || 0)}
                  </p>
                </div>
                <div className="text-4xl">📊</div>
              </div>
            </div>

          <div className="bg-purple-50 p-6 rounded-xl">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <span className="text-2xl">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">Staff Involved</p>
                <p className="text-2xl font-bold text-purple-900">
                  {data.discountSummary.staffCount || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Discount Details */}
      {data.discountDetails && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Discount Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.discountDetails?.map((discount) => (
                  <tr key={discount.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{discount.orderNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {discount.staffName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      -{formatCurrency(discount.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {discount.reason || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(discount.date).toLocaleDateString()}
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
      <h3 className="text-lg font-medium text-gray-900 mb-2">No Sales Data Available</h3>
      <p className="text-gray-500 mb-4">
        There's no sales data to display for the selected period and report type.
      </p>
      <div className="text-sm text-gray-400">
        Try selecting a different period or report type.
      </div>
    </div>
  );

  const renderReportContent = () => {
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
      case 'summary':
        return renderSalesSummary();
      case 'menu-performance':
        return renderMenuPerformance();
      case 'peak-hours':
        return renderPeakHours();
      case 'table-performance':
        return renderTablePerformance();
      case 'category-sales':
        return renderCategorySales();
      case 'discounts':
        return renderDiscounts();
      default:
        return renderSalesSummary();
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Header */}
      <ReportsFilter
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        customDateRange={customDateRange}
        onCustomDateChange={handleCustomDateChange}
        onExport={exportReport}
        title="Sales Reports"
        subtitle="Revenue, orders, and menu performance analysis"
      />

      {/* Report Type Selection */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-wrap gap-3">
          {reports.map((report) => (
            <button
              key={report.id}
              onClick={() => setActiveReport(report.id)}
              className={`px-6 py-4 rounded-xl text-sm font-medium flex items-center space-x-3 transition-all ${
                activeReport === report.id
                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-300 shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
              }`}
            >
              <span className="text-xl">{report.icon}</span>
              <div className="text-left">
                <div className="font-semibold">{report.name}</div>
                <div className="text-xs opacity-75">{report.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        renderReportContent()
      )}
    </div>
  );
};

export default SalesReports; 