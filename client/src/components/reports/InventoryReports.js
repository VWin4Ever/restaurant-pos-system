import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import ReportsFilter from './ReportsFilter';

const InventoryReports = () => {
  const [activeReport, setActiveReport] = useState('stock-levels');
  const [data, setData] = useState({});
  const [loading, setLocalLoading] = useState(false);
  const [dateRange, setDateRange] = useState('today');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // Inventory-focused reports
  const reports = [
    { id: 'stock-levels', name: 'Stock Levels', icon: '📦', description: 'Current inventory levels and alerts' },
    { id: 'wastage', name: 'Wastage', icon: '🗑️', description: 'Food waste and spoilage tracking' },
    { id: 'movements', name: 'Movements', icon: '📊', description: 'Stock in/out movements' },
    { id: 'alerts', name: 'Alerts', icon: '⚠️', description: 'Low stock and expiry alerts' }
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

      const response = await axios.get(`/api/reports/inventory/${activeReport}?${params}`);
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

      const response = await axios.get(`/api/reports/inventory/${activeReport}/export?${params}`, {
        responseType: 'blob'
      });
      
      if (!response.data || response.data.size === 0) {
        toast.error('No data available for export');
        return;
      }
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `inventory-${activeReport}-${dateRange}-${new Date().toISOString().split('T')[0]}.${format}`);
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

  const renderStockLevels = () => (
    <div className="space-y-6">
      {/* Stock Summary */}
      {data.stockSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Items</p>
                <p className="text-3xl font-bold">
                  {data.stockSummary.totalItems || 0}
                </p>
              </div>
              <div className="text-4xl">📦</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">In Stock</p>
                <p className="text-3xl font-bold">
                  {data.stockSummary.inStock || 0}
                </p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Low Stock</p>
                <p className="text-3xl font-bold">
                  {data.stockSummary.lowStock || 0}
                </p>
              </div>
              <div className="text-4xl">⚠️</div>
            </div>
          </div>

          <div className="bg-orange-50 p-6 rounded-xl">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <span className="text-2xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-600">Total Value</p>
                <p className="text-2xl font-bold text-orange-900">
                  {formatCurrency(data.stockSummary.totalValue || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock Levels Chart */}
      {data.stockLevels && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Levels by Category</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data.stockLevels}>
              <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="quantity" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Stock Details */}
      {data.stockDetails && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Stock Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.stockDetails?.map((item) => (
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.minLevel}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.quantity <= item.minLevel ? 'bg-red-100 text-red-800' :
                        item.quantity <= item.minLevel * 1.5 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {item.quantity <= item.minLevel ? 'Low' :
                         item.quantity <= item.minLevel * 1.5 ? 'Medium' : 'Good'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(item.value)}
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

  const renderWastage = () => (
    <div className="space-y-6">
      {/* Wastage Summary */}
      {data.wastageSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-red-50 p-6 rounded-xl">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <span className="text-2xl">🗑️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-red-600">Total Wastage</p>
                <p className="text-2xl font-bold text-red-900">
                  {data.wastageSummary.totalWastage || 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 p-6 rounded-xl">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <span className="text-2xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-600">Lost Value</p>
                <p className="text-2xl font-bold text-orange-900">
                  {formatCurrency(data.wastageSummary.lostValue || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-xl">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <span className="text-2xl">📦</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Items Wasted</p>
                <p className="text-2xl font-bold text-blue-900">
                  {data.wastageSummary.itemsWasted || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-6 rounded-xl">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">Avg Wastage</p>
                <p className="text-2xl font-bold text-purple-900">
                  {data.wastageSummary.averageWastage || 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wastage Chart */}
      {data.wastageByCategory && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Wastage by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.wastageByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="wastage"
              >
                {data.wastageByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}%`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Wastage Details */}
      {data.wastageDetails && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Wastage Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wastage %</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lost Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.wastageDetails?.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.wastagePercentage}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      {formatCurrency(item.lostValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.reason || 'N/A'}
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

  const renderMovements = () => (
    <div className="space-y-6">
      {/* Movements Summary */}
      {data.movementsSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Stock In</p>
                <p className="text-3xl font-bold">
                  {data.movementsSummary.stockIn || 0}
                </p>
              </div>
              <div className="text-4xl">📥</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Stock Out</p>
                <p className="text-3xl font-bold">
                  {data.movementsSummary.stockOut || 0}
                </p>
              </div>
              <div className="text-4xl">📤</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Net Movement</p>
                <p className="text-3xl font-bold">
                  {data.movementsSummary.netMovement || 0}
                </p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>
        </div>
      )}

      {/* Movements Chart */}
      {data.movements && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Movements</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.movements}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="stockIn" fill="#00C49F" name="Stock In" />
              <Bar dataKey="stockOut" fill="#FF8042" name="Stock Out" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );

  const renderAlerts = () => (
    <div className="space-y-6">
      {/* Alerts Summary */}
      {data.alertsSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-red-50 p-6 rounded-xl">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-red-600">Low Stock</p>
                <p className="text-2xl font-bold text-red-900">
                  {data.alertsSummary.lowStock || 0}
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
                <p className="text-sm font-medium text-orange-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-orange-900">
                  {data.alertsSummary.expiringSoon || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-6 rounded-xl">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">Total Alerts</p>
                <p className="text-2xl font-bold text-purple-900">
                  {data.alertsSummary.totalAlerts || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerts List */}
      {data.alerts && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Active Alerts</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Threshold</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.alerts?.map((alert) => (
                  <tr key={alert.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {alert.itemName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {alert.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {alert.currentLevel}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {alert.threshold}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {alert.expiryDate ? new Date(alert.expiryDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        alert.priority === 'High' ? 'bg-red-100 text-red-800' :
                        alert.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {alert.priority}
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
      <div className="text-6xl mb-4">📦</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No Inventory Data Available</h3>
      <p className="text-gray-500 mb-4">
        There's no inventory data to display for the selected period and report type.
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
      case 'stock-levels':
        return renderStockLevels();
      case 'wastage':
        return renderWastage();
      case 'movements':
        return renderMovements();
      case 'alerts':
        return renderAlerts();
      default:
        return renderStockLevels();
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
        title="Inventory Reports"
        subtitle="Stock levels, wastage, and inventory management"
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

export default InventoryReports; 