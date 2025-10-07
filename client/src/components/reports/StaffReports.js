import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import ReportsFilter from './ReportsFilter';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const StaffReports = () => {
  const { user } = useAuth();
  const [activeReport, setActiveReport] = useState('performance');
  const [data, setData] = useState({});
  const [loading, setLocalLoading] = useState(false);
  const [dateRange, setDateRange] = useState('today');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // Role-based staff reports
  const isCashier = user?.role === 'CASHIER';
  const reports = isCashier ? [
    { id: 'performance', name: 'My Performance', icon: '📊', description: 'My productivity and metrics' },
    { id: 'activity', name: 'My Activity', icon: '👥', description: 'My activity and orders handled' },
    { id: 'sales', name: 'My Sales', icon: '💰', description: 'My sales performance' }
  ] : [
    { id: 'performance', name: 'Performance', icon: '📊', description: 'Staff productivity and metrics' },
    { id: 'activity', name: 'Activity', icon: '👥', description: 'Staff activity and orders handled' },
    { id: 'sales', name: 'Sales', icon: '💰', description: 'Sales performance by staff' },
    { id: 'hours', name: 'Hours', icon: '⏰', description: 'Working hours and schedules' }
  ];

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

      // Use cashier-specific endpoints for cashiers
      const endpoint = isCashier ? `/api/reports/cashier-${activeReport}` : `/api/reports/staff/${activeReport}`;
      const response = await axios.get(`${endpoint}?${params}`);
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

      const response = await axios.get(`/api/reports/staff/${activeReport}/export?${params}`, {
        responseType: 'blob'
      });
      
      if (!response.data || response.data.size === 0) {
        toast.error('No data available for export');
        return;
      }
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `staff-${activeReport}-${dateRange}-${new Date().toISOString().split('T')[0]}.${format}`);
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

  const renderPerformance = () => (
    <div className="space-y-6">
      {/* Performance Summary */}
      {data.performanceSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Staff</p>
                <p className="text-3xl font-bold">
                  {data.performanceSummary.totalStaff || 0}
                </p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Orders Handled</p>
                <p className="text-3xl font-bold">
                  {data.performanceSummary.totalOrders || 0}
                </p>
              </div>
              <div className="text-4xl">📋</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Sales</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(data.performanceSummary.totalSales || 0)}
                </p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>

          <div className="bg-orange-50 p-6 rounded-xl">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <span className="text-2xl">⭐</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-600">Avg Performance</p>
                <p className="text-2xl font-bold text-orange-900">
                  {data.performanceSummary.averagePerformance || 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Chart */}
      {data.staffPerformance && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Staff Performance</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data.staffPerformance}>
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="sales" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Staff Details */}
      {data.staffDetails && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Staff Performance Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sales</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performance</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.staffDetails?.map((staff) => (
                  <tr key={staff.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {staff.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {staff.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {staff.orders}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(staff.sales)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {staff.performance}%
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

  const renderActivity = () => (
    <div className="space-y-6">
      {/* Activity Summary */}
      {data.activitySummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Active Staff</p>
                <p className="text-3xl font-bold">
                  {data.activitySummary.activeStaff || 0}
                </p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Orders Today</p>
                <p className="text-3xl font-bold">
                  {data.activitySummary.ordersToday || 0}
                </p>
              </div>
              <div className="text-4xl">📋</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Avg Response</p>
                <p className="text-3xl font-bold">
                  {data.activitySummary.avgResponseTime || 0} min
                </p>
              </div>
              <div className="text-4xl">⏰</div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Chart */}
      {data.staffActivity && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Staff Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.staffActivity}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="orders" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );

  const renderSales = () => (
    <div className="space-y-6">
      {/* Sales Summary */}
      {data.salesSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Sales</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(data.salesSummary.totalSales || 0)}
                </p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Top Performer</p>
                <p className="text-3xl font-bold">
                  {data.salesSummary.topPerformer || 'N/A'}
                </p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Avg Sale</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(data.salesSummary.averageSale || 0)}
                </p>
              </div>
              <div className="text-4xl">📈</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Target Met</p>
                <p className="text-3xl font-bold">
                  {data.salesSummary.targetMet || 0}%
                </p>
              </div>
              <div className="text-4xl">🎯</div>
            </div>
          </div>
        </div>
      )}

      {/* Sales Chart */}
      {data.staffSales && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales by Staff</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data.staffSales}>
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="sales" fill="#FFBB28" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );

  const renderHours = () => (
    <div className="space-y-6">
      {/* Hours Summary */}
      {data.hoursSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Hours</p>
                <p className="text-3xl font-bold">
                  {data.hoursSummary.totalHours || 0}h
                </p>
              </div>
              <div className="text-4xl">⏰</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Staff on Duty</p>
                <p className="text-3xl font-bold">
                  {data.hoursSummary.staffOnDuty || 0}
                </p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Avg Shift</p>
                <p className="text-3xl font-bold">
                  {data.hoursSummary.averageShift || 0}h
                </p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>
        </div>
      )}

      {/* Hours Chart */}
      {data.staffHours && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Working Hours</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.staffHours}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="hours" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );

  const renderEmptyState = () => (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">👥</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No Staff Data Available</h3>
      <p className="text-gray-500 mb-4">
        There's no staff data to display for the selected period and report type.
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
      case 'performance':
        return renderPerformance();
      case 'activity':
        return renderActivity();
      case 'sales':
        return renderSales();
      case 'hours':
        return renderHours();
      default:
        return renderPerformance();
    }
  };

  // Redirect cashiers to sales reports since they should only access sales
  if (user?.role === 'CASHIER') {
    return <Navigate to="/reports/sales" replace />;
  }

  return (
    <div className="space-y-6">
      {/* Filter Header */}
      <ReportsFilter
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        customDateRange={customDateRange}
        onCustomDateChange={handleCustomDateChange}
        onExport={exportReport}
        title="Staff Reports"
        subtitle="Employee performance and activity analysis"
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

export default StaffReports; 