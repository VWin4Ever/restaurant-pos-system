import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const OperationalReports = React.memo(({ dateRange, customDateRange }) => {
  const [activeReport, setActiveReport] = useState('table-performance');
  const [data, setData] = useState({});
  const [loading, setLocalLoading] = useState(false);

  // Operational reports - reorganized by logical grouping
  const reports = [
    // Performance Analysis
    { id: 'table-performance', name: 'Table Performance', icon: '🪑' },
    { id: 'peak-hours', name: 'Peak Hours Analysis', icon: '⏰' },
    { id: 'service-efficiency', name: 'Service Efficiency', icon: '⚡' },
    // Planning & Metrics
    { id: 'capacity-planning', name: 'Capacity Planning', icon: '📊' },
    { id: 'operational-metrics', name: 'Operational Metrics', icon: '📈' }
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

      const response = await axios.get(`/api/reports/operational/${activeReport}?${params}`);
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

      const response = await axios.get(`/api/reports/operational/${activeReport}/export?${params}`, {
        responseType: 'blob'
      });
      
      if (!response.data || response.data.size === 0) {
        toast.error('No data available for export');
        return;
      }
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const fileExtension = format === 'excel' ? 'csv' : format;
      link.setAttribute('download', `${activeReport}-${dateRange}-${new Date().toISOString().split('T')[0]}.${fileExtension}`);
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

  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }, []);

  const renderTablePerformance = () => (
    <div className="space-y-6">
      {/* Performance Summary */}
      {data.tableSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-50 p-6 rounded-xl">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <span className="text-2xl">🪑</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Total Tables</p>
                <p className="text-2xl font-bold text-blue-900">
                  {data.tableSummary.totalTables || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-xl">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Avg Utilization</p>
                <p className="text-2xl font-bold text-green-900">
                  {data.tableSummary.averageUtilization || 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-6 rounded-xl">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <span className="text-2xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">Avg Revenue/Table</p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatCurrency(data.tableSummary.averageRevenuePerTable || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 p-6 rounded-xl">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <span className="text-2xl">⏱️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-600">Avg Turn Time</p>
                <p className="text-2xl font-bold text-orange-900">
                  {data.tableSummary.averageTurnTime || 0} min
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table Performance Chart */}
      {data.tablePerformance && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Table Performance Overview</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data.tablePerformance}>
              <XAxis dataKey="tableNumber" />
              <YAxis />
              <Tooltip formatter={(value, name) => [value, name === 'revenue' ? 'Revenue' : 'Orders']} />
              <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
              <Bar dataKey="orders" fill="#82ca9d" name="Orders" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table Details */}
      {data.tableDetails && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Detailed Table Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Table</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilization</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Turn Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
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
                      {table.utilization}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {table.averageTurnTime} min
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        table.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                        table.status === 'OCCUPIED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {table.status}
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

  const renderPeakHours = () => (
    <div className="space-y-6">
      {/* Peak Hours Summary */}
      {data.peakSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-red-50 p-6 rounded-xl">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <span className="text-2xl">🔥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-red-600">Peak Hours</p>
                <p className="text-2xl font-bold text-red-900">
                  {data.peakSummary.peakHours || 'N/A'}
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
                <p className="text-sm font-medium text-blue-600">Peak Revenue</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(data.peakSummary.peakRevenue || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-xl">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <span className="text-2xl">📈</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Peak Orders</p>
                <p className="text-2xl font-bold text-green-900">
                  {data.peakSummary.peakOrders || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hourly Chart */}
      {data.hourlyData && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hourly Revenue Pattern</h3>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={data.hourlyData}>
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Day of Week Analysis */}
      {data.dayOfWeekData && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Day of Week Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.dayOfWeekData}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="revenue" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );

  const renderServiceEfficiency = () => (
    <div className="space-y-6">
      {/* Efficiency Metrics */}
      {data.efficiencyMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-green-50 p-6 rounded-xl">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <span className="text-2xl">⚡</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Avg Order Time</p>
                <p className="text-2xl font-bold text-green-900">
                  {data.efficiencyMetrics.averageOrderTime || 0} min
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
                <p className="text-sm font-medium text-blue-600">Orders/Hour</p>
                <p className="text-2xl font-bold text-blue-900">
                  {data.efficiencyMetrics.ordersPerHour || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-6 rounded-xl">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <span className="text-2xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">Revenue/Hour</p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatCurrency(data.efficiencyMetrics.revenuePerHour || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 p-6 rounded-xl">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <span className="text-2xl">🎯</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-600">Efficiency Score</p>
                <p className="text-2xl font-bold text-orange-900">
                  {data.efficiencyMetrics.efficiencyScore || 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Efficiency Trends */}
      {data.efficiencyTrends && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Efficiency Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.efficiencyTrends}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="orderTime" stroke="#8884d8" strokeWidth={2} name="Order Time (min)" />
              <Line type="monotone" dataKey="efficiency" stroke="#82ca9d" strokeWidth={2} name="Efficiency Score (%)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );

  const renderCapacityPlanning = () => (
    <div className="space-y-6">
      {/* Capacity Metrics */}
      {data.capacityMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-6 rounded-xl">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <span className="text-2xl">🪑</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Optimal Capacity</p>
                <p className="text-2xl font-bold text-blue-900">
                  {data.capacityMetrics.optimalCapacity || 0} seats
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-xl">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Current Utilization</p>
                <p className="text-2xl font-bold text-green-900">
                  {data.capacityMetrics.currentUtilization || 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-6 rounded-xl">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <span className="text-2xl">📈</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">Growth Potential</p>
                <p className="text-2xl font-bold text-purple-900">
                  {data.capacityMetrics.growthPotential || 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Capacity Recommendations */}
      {data.capacityRecommendations && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Capacity Planning Recommendations</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {data.capacityRecommendations.map((rec, index) => (
                <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl">{rec.icon}</div>
                  <div>
                    <h4 className="font-medium text-gray-900">{rec.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                    {rec.impact && (
                      <p className="text-sm text-blue-600 mt-2">
                        <strong>Impact:</strong> {rec.impact}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderOperationalMetrics = () => (
    <div className="space-y-6">
      {/* KPI Dashboard */}
      {data.kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Customer Satisfaction</p>
                <p className="text-3xl font-bold">{data.kpis.customerSatisfaction || 0}%</p>
              </div>
              <div className="text-4xl">😊</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Table Turnover Rate</p>
                <p className="text-3xl font-bold">{data.kpis.tableTurnoverRate || 0}/day</p>
              </div>
              <div className="text-4xl">🔄</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Staff Productivity</p>
                <p className="text-3xl font-bold">{data.kpis.staffProductivity || 0}%</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Operational Efficiency</p>
                <p className="text-3xl font-bold">{data.kpis.operationalEfficiency || 0}%</p>
              </div>
              <div className="text-4xl">⚡</div>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Comparison */}
      {data.metricsComparison && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.metricsComparison}>
              <XAxis dataKey="metric" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="current" fill="#8884d8" name="Current Period" />
              <Bar dataKey="previous" fill="#82ca9d" name="Previous Period" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );

  const renderEmptyState = () => (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">⚙️</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No Operational Data Available</h3>
      <p className="text-gray-500 mb-4">
        There's no operational data to display for the selected date range and report type.
      </p>
      <div className="text-sm text-gray-400">
        Try selecting a different date range or report type.
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
      case 'table-performance':
        return renderTablePerformance();
      case 'peak-hours':
        return renderPeakHours();
      case 'service-efficiency':
        return renderServiceEfficiency();
      case 'capacity-planning':
        return renderCapacityPlanning();
      case 'operational-metrics':
        return renderOperationalMetrics();
      default:
        return renderTablePerformance();
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Type Selection */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {reports.map((report) => (
            <button
              key={report.id}
              onClick={() => setActiveReport(report.id)}
              className={`px-4 py-3 rounded-xl text-sm font-medium flex items-center space-x-3 transition-all ${
                activeReport === report.id
                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-300 shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
              }`}
            >
              <span className="text-xl">{report.icon}</span>
              <div className="font-semibold">{report.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Export Controls */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={() => exportReport('csv')}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
        >
          📊 Export CSV
        </button>
        <button
          onClick={() => exportReport('pdf')}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
        >
          📄 Export PDF
        </button>
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
});

export default OperationalReports;

