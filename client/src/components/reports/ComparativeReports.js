import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import ReportsFilter from './ReportsFilter';
import EmptyState from './EmptyState';

const ComparativeReports = () => {
  const [activeReport, setActiveReport] = useState('period-analysis');
  const [data, setData] = useState({});
  const [loading, setLocalLoading] = useState(false);
  const [dateRange, setDateRange] = useState('week');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [compareWith, setCompareWith] = useState('previous_period');

  const reports = [
    { 
      id: 'period-analysis', 
      name: 'Period Analysis', 
      icon: '📊', 
      description: 'Compare current vs previous periods' 
    }
  ];

  const comparisonOptions = [
    { value: 'previous_period', label: 'Previous Period' },
    { value: 'same_period_last_year', label: 'Same Period Last Year' }
  ];

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchReportData();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [activeReport, dateRange, customDateRange.startDate, customDateRange.endDate, compareWith]);

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
      params.append('compareWith', compareWith);

      const response = await axios.get(`/api/reports/comparative/${activeReport}?${params}`);
      setData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch comparative report data:', error);
      toast.error('Failed to load comparative report data');
    } finally {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
      
      setTimeout(() => {
        setLocalLoading(false);
      }, remainingTime);
    }
  }, [activeReport, dateRange, customDateRange.startDate, customDateRange.endDate, compareWith]);

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

  const formatPercentage = useCallback((value) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  }, []);

  const getGrowthColor = useCallback((value) => {
    if (value > 25) return 'text-green-600';
    if (value > 15) return 'text-blue-600';
    if (value > 5) return 'text-yellow-600';
    if (value > -5) return 'text-orange-600';
    return 'text-red-600';
  }, []);

  const getGrowthContext = useCallback((value, metric) => {
    const thresholds = {
      revenue: { excellent: 25, good: 15, moderate: 5, poor: -5 },
      orders: { excellent: 20, good: 10, moderate: 3, poor: -3 },
      items: { excellent: 20, good: 10, moderate: 3, poor: -3 },
      averageOrder: { excellent: 15, good: 8, moderate: 2, poor: -2 }
    };
    
    const t = thresholds[metric] || thresholds.revenue;
    if (value >= t.excellent) return { level: 'Excellent', icon: '🚀', color: 'green' };
    if (value >= t.good) return { level: 'Good', icon: '📈', color: 'blue' };
    if (value >= t.moderate) return { level: 'Moderate', icon: '📊', color: 'yellow' };
    if (value >= t.poor) return { level: 'Needs Attention', icon: '⚠️', color: 'orange' };
    return { level: 'Critical', icon: '🔻', color: 'red' };
  }, []);

  const renderPeriodAnalysis = () => (
    <div className="space-y-6">
      {/* Comparison Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Revenue Growth</p>
              <p className="text-3xl font-bold">
                {data.growthAnalysis ? formatPercentage(data.growthAnalysis.revenueGrowth) : '0%'}
              </p>
              {data.growthAnalysis && (
                <p className="text-xs opacity-75 mt-1">
                  {getGrowthContext(data.growthAnalysis.revenueGrowth, 'revenue').icon} {getGrowthContext(data.growthAnalysis.revenueGrowth, 'revenue').level}
                </p>
              )}
            </div>
            <div className="text-4xl">
              {data.growthAnalysis ? getGrowthContext(data.growthAnalysis.revenueGrowth, 'revenue').icon : '📈'}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Orders Growth</p>
              <p className="text-3xl font-bold">
                {data.growthAnalysis ? formatPercentage(data.growthAnalysis.ordersGrowth) : '0%'}
              </p>
              {data.growthAnalysis && (
                <p className="text-xs opacity-75 mt-1">
                  {getGrowthContext(data.growthAnalysis.ordersGrowth, 'orders').icon} {getGrowthContext(data.growthAnalysis.ordersGrowth, 'orders').level}
                </p>
              )}
            </div>
            <div className="text-4xl">
              {data.growthAnalysis ? getGrowthContext(data.growthAnalysis.ordersGrowth, 'orders').icon : '📋'}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Items Growth</p>
              <p className="text-3xl font-bold">
                {data.growthAnalysis ? formatPercentage(data.growthAnalysis.itemsGrowth) : '0%'}
              </p>
              {data.growthAnalysis && (
                <p className="text-xs opacity-75 mt-1">
                  {getGrowthContext(data.growthAnalysis.itemsGrowth, 'items').icon} {getGrowthContext(data.growthAnalysis.itemsGrowth, 'items').level}
                </p>
              )}
            </div>
            <div className="text-4xl">
              {data.growthAnalysis ? getGrowthContext(data.growthAnalysis.itemsGrowth, 'items').icon : '🍽️'}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Avg Order Growth</p>
              <p className="text-3xl font-bold">
                {data.growthAnalysis ? formatPercentage(data.growthAnalysis.averageOrderGrowth) : '0%'}
              </p>
              {data.growthAnalysis && (
                <p className="text-xs opacity-75 mt-1">
                  {getGrowthContext(data.growthAnalysis.averageOrderGrowth, 'averageOrder').icon} {getGrowthContext(data.growthAnalysis.averageOrderGrowth, 'averageOrder').level}
                </p>
              )}
            </div>
            <div className="text-4xl">
              {data.growthAnalysis ? getGrowthContext(data.growthAnalysis.averageOrderGrowth, 'averageOrder').icon : '💰'}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Comparison */}
      {data.currentPeriod && data.comparisonPeriod && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Detailed Comparison</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Current Period */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-blue-600">Current Period</h4>
              <p className="text-sm text-gray-500">{data.currentPeriod.period}</p>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Revenue:</span>
                  <span className="font-semibold">{formatCurrency(data.currentPeriod.totalRevenue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Orders:</span>
                  <span className="font-semibold">{data.currentPeriod.totalOrders}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Items Sold:</span>
                  <span className="font-semibold">{data.currentPeriod.totalItems}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg Order Value:</span>
                  <span className="font-semibold">{formatCurrency(data.currentPeriod.averageOrder)}</span>
                </div>
              </div>
            </div>

            {/* Comparison Period */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-gray-600">Comparison Period</h4>
              <p className="text-sm text-gray-500">{data.comparisonPeriod.period}</p>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Revenue:</span>
                  <span className="font-semibold">{formatCurrency(data.comparisonPeriod.totalRevenue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Orders:</span>
                  <span className="font-semibold">{data.comparisonPeriod.totalOrders}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Items Sold:</span>
                  <span className="font-semibold">{data.comparisonPeriod.totalItems}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg Order Value:</span>
                  <span className="font-semibold">{formatCurrency(data.comparisonPeriod.averageOrder)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Growth Indicators */}
          {data.growthAnalysis && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-md font-semibold text-gray-900 mb-4">Growth Indicators</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getGrowthColor(data.growthAnalysis.revenueGrowth)}`}>
                    {formatPercentage(data.growthAnalysis.revenueGrowth)}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center justify-center space-x-1">
                    <span>Revenue</span>
                    <span className={`text-xs ${getGrowthColor(data.growthAnalysis.revenueGrowth)}`}>
                      {data.growthAnalysis.revenueGrowth > 0 ? '↗️' : data.growthAnalysis.revenueGrowth < 0 ? '↘️' : '→'}
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getGrowthColor(data.growthAnalysis.ordersGrowth)}`}>
                    {formatPercentage(data.growthAnalysis.ordersGrowth)}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center justify-center space-x-1">
                    <span>Orders</span>
                    <span className={`text-xs ${getGrowthColor(data.growthAnalysis.ordersGrowth)}`}>
                      {data.growthAnalysis.ordersGrowth > 0 ? '↗️' : data.growthAnalysis.ordersGrowth < 0 ? '↘️' : '→'}
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getGrowthColor(data.growthAnalysis.itemsGrowth)}`}>
                    {formatPercentage(data.growthAnalysis.itemsGrowth)}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center justify-center space-x-1">
                    <span>Items</span>
                    <span className={`text-xs ${getGrowthColor(data.growthAnalysis.itemsGrowth)}`}>
                      {data.growthAnalysis.itemsGrowth > 0 ? '↗️' : data.growthAnalysis.itemsGrowth < 0 ? '↘️' : '→'}
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getGrowthColor(data.growthAnalysis.averageOrderGrowth)}`}>
                    {formatPercentage(data.growthAnalysis.averageOrderGrowth)}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center justify-center space-x-1">
                    <span>Avg Order</span>
                    <span className={`text-xs ${getGrowthColor(data.growthAnalysis.averageOrderGrowth)}`}>
                      {data.growthAnalysis.averageOrderGrowth > 0 ? '↗️' : data.growthAnalysis.averageOrderGrowth < 0 ? '↘️' : '→'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Comparison Chart */}
      {data.currentPeriod && data.comparisonPeriod && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              {
                period: 'Current',
                revenue: data.currentPeriod.totalRevenue,
                orders: data.currentPeriod.totalOrders,
                items: data.currentPeriod.totalItems
              },
              {
                period: 'Previous',
                revenue: data.comparisonPeriod.totalRevenue,
                orders: data.comparisonPeriod.totalOrders,
                items: data.comparisonPeriod.totalItems
              }
            ]}>
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip formatter={(value, name) => [
                name === 'revenue' ? formatCurrency(value) : value,
                name.charAt(0).toUpperCase() + name.slice(1)
              ]} />
              <Bar dataKey="revenue" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );

  const renderEmptyState = () => (
    <EmptyState
      type="no-comparison"
      action={() => {
        setDateRange('week');
        setCompareWith('previous_period');
      }}
      actionText="Reset to Default"
    />
  );

  const renderReportContent = () => {
    const hasData = Object.keys(data).length > 0;

    if (!loading && !hasData) {
      return renderEmptyState();
    }

    switch (activeReport) {
      case 'period-analysis':
        return renderPeriodAnalysis();
      default:
        return renderPeriodAnalysis();
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
        title="Comparative Reports"
        subtitle="Period-over-period analysis and growth tracking"
      />

      {/* Comparison Type Selection */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Comparison Type</h3>
            <p className="text-sm text-gray-500">Select what to compare the current period against</p>
          </div>
          <div className="flex space-x-2">
            {comparisonOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setCompareWith(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  compareWith === option.value
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

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

export default ComparativeReports;
