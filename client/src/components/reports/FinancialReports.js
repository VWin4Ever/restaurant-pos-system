import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import ReportsFilter from './ReportsFilter';

const FinancialReports = () => {
  const [activeReport, setActiveReport] = useState('profit');
  const [data, setData] = useState({});
  const [loading, setLocalLoading] = useState(false);
  const [dateRange, setDateRange] = useState('today');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // Financial-focused reports
  const reports = [
    { id: 'profit', name: 'Profit Analysis', icon: '💰', description: 'Revenue, costs, and profit margins' },
    { id: 'tax', name: 'Tax Report', icon: '📊', description: 'Tax calculations and compliance' },
    { id: 'payments', name: 'Payment Methods', icon: '💳', description: 'Payment method analysis' },
    { id: 'end-of-day', name: 'End of Day', icon: '📅', description: 'Daily closing reports' }
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

      const response = await axios.get(`/api/reports/financial/${activeReport}?${params}`);
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

      const response = await axios.get(`/api/reports/financial/${activeReport}/export?${params}`, {
        responseType: 'blob'
      });
      
      if (!response.data || response.data.size === 0) {
        toast.error('No data available for export');
        return;
      }
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `financial-${activeReport}-${dateRange}-${new Date().toISOString().split('T')[0]}.${format}`);
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

  const renderProfit = () => (
    <div className="space-y-6">
      {/* Profit Summary */}
      {data.profitSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Revenue</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(data.profitSummary.totalRevenue || 0)}
                </p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Costs</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(data.profitSummary.totalCosts || 0)}
                </p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Net Profit</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(data.profitSummary.netProfit || 0)}
                </p>
              </div>
              <div className="text-4xl">📈</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Profit Margin</p>
                <p className="text-3xl font-bold">
                  {data.profitSummary.profitMargin || 0}%
                </p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>
        </div>
      )}

      {/* Profit Chart */}
      {data.profitChart && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Profit Trend</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data.profitChart}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" />
              <Line type="monotone" dataKey="costs" stroke="#ef4444" strokeWidth={2} name="Costs" />
              <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} name="Profit" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );

  const renderTax = () => (
    <div className="space-y-6">
      {/* Tax Summary */}
      {data.taxSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Tax</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(data.taxSummary.totalTax || 0)}
                </p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Taxable Amount</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(data.taxSummary.taxableAmount || 0)}
                </p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Tax Rate</p>
                <p className="text-3xl font-bold">
                  {data.taxSummary.taxRate || 0}%
                </p>
              </div>
              <div className="text-4xl">📈</div>
            </div>
          </div>
        </div>
      )}

      {/* Tax Chart */}
      {data.taxChart && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tax Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.taxChart}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="amount"
              >
                {data.taxChart.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );

  const renderPayments = () => (
    <div className="space-y-6">
      {/* Payment Summary */}
      {data.paymentSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Card Payments</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(data.paymentSummary.cardPayments || 0)}
                </p>
              </div>
              <div className="text-4xl">💳</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Cash Payments</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(data.paymentSummary.cashPayments || 0)}
                </p>
              </div>
              <div className="text-4xl">💵</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Digital Payments</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(data.paymentSummary.digitalPayments || 0)}
                </p>
              </div>
              <div className="text-4xl">📱</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Payments</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(data.paymentSummary.totalPayments || 0)}
                </p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Chart */}
      {data.paymentChart && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.paymentChart}>
              <XAxis dataKey="method" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="amount" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );

  const renderEndOfDay = () => (
    <div className="space-y-6">
      {/* End of Day Summary */}
      {data.endOfDaySummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Daily Revenue</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(data.endOfDaySummary.dailyRevenue || 0)}
                </p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Orders Today</p>
                <p className="text-3xl font-bold">
                  {data.endOfDaySummary.ordersToday || 0}
                </p>
              </div>
              <div className="text-4xl">📋</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Avg Order Value</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(data.endOfDaySummary.averageOrderValue || 0)}
                </p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Closing Time</p>
                <p className="text-3xl font-bold">
                  {data.endOfDaySummary.closingTime || 'N/A'}
                </p>
              </div>
              <div className="text-4xl">⏰</div>
            </div>
          </div>
        </div>
      )}

      {/* End of Day Details */}
      {data.endOfDayDetails && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">End of Day Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.endOfDayDetails?.map((item) => (
                  <tr key={item.category} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.percentage}%
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
      <div className="text-6xl mb-4">💳</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No Financial Data Available</h3>
      <p className="text-gray-500 mb-4">
        There's no financial data to display for the selected period and report type.
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
      case 'profit':
        return renderProfit();
      case 'tax':
        return renderTax();
      case 'payments':
        return renderPayments();
      case 'end-of-day':
        return renderEndOfDay();
      default:
        return renderProfit();
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
        title="Financial Reports"
        subtitle="Revenue, costs, taxes, and payment analysis"
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

export default FinancialReports; 