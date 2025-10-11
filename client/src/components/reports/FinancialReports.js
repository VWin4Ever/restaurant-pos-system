import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useSettings } from '../../contexts/SettingsContext';
import ReportsFilter from './ReportsFilter';

const FinancialReports = () => {
  const { getTaxRate } = useSettings();
  const [activeReport, setActiveReport] = useState('profit');
  const [data, setData] = useState({});
  const [loading, setLocalLoading] = useState(false);
  const [dateRange, setDateRange] = useState('today');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [comparisonType, setComparisonType] = useState('today_vs_yesterday');
  const [comparisonPeriods, setComparisonPeriods] = useState({
    period1: {
      startDate: '',
      endDate: ''
    },
    period2: {
      startDate: '',
      endDate: ''
    }
  });

  // Financial-focused reports - core financial analysis only
  const reports = [
    // Financial Analysis
    { id: 'profit', name: 'Profit Analysis', icon: '💰' },
    { id: 'comparative', name: 'Comparative Report', icon: '📈' }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchReportData();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [activeReport, dateRange, customDateRange.startDate, customDateRange.endDate, comparisonType, comparisonPeriods]);

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

      let endpoint = `/api/reports/financial/${activeReport}`;
      
      // Use different endpoint for comparative report
      if (activeReport === 'comparative') {
        endpoint = '/api/reports/comparative/period-analysis';
        params.append('compareWith', comparisonType);
        
        // Add custom period parameters if using custom periods
        if (comparisonType === 'custom') {
          if (comparisonPeriods.period1.startDate && comparisonPeriods.period1.endDate) {
            params.append('period1StartDate', comparisonPeriods.period1.startDate);
            params.append('period1EndDate', comparisonPeriods.period1.endDate);
          }
          if (comparisonPeriods.period2.startDate && comparisonPeriods.period2.endDate) {
            params.append('period2StartDate', comparisonPeriods.period2.startDate);
            params.append('period2EndDate', comparisonPeriods.period2.endDate);
          }
        }
      }
      
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
  }, [activeReport, dateRange, customDateRange.startDate, customDateRange.endDate, comparisonType, comparisonPeriods]);

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
      const fileExtension = format === 'excel' ? 'csv' : format;
      link.setAttribute('download', `financial-${activeReport}-${dateRange}-${new Date().toISOString().split('T')[0]}.${fileExtension}`);
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

  const handleComparisonTypeChange = useCallback((value) => {
    setComparisonType(value);
  }, []);

  const handleComparisonPeriodChange = useCallback((period, field, value) => {
    setComparisonPeriods(prev => ({
      ...prev,
      [period]: {
        ...prev[period],
        [field]: value
      }
    }));
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
                  {formatCurrency((data.profitSummary.totalRevenue || 0) * 0.9)}
                </p>
                <p className="text-xs opacity-75 mt-1">-VAT (10%)</p>
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
                  {formatCurrency(((data.profitSummary.totalRevenue || 0) * 0.9) - (data.profitSummary.totalCosts || 0))}
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
                  {(() => {
                    const adjustedRevenue = (data.profitSummary.totalRevenue || 0) * 0.9;
                    const costs = data.profitSummary.totalCosts || 0;
                    const netProfit = adjustedRevenue - costs;
                    return adjustedRevenue > 0 ? ((netProfit / adjustedRevenue) * 100).toFixed(1) : 0;
                  })()}%
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

      {/* Category Analysis */}
      {data.categoryAnalysis && data.categoryAnalysis.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Profit by Category</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Costs</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Margin</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.categoryAnalysis.map((category) => {
                  // Calculate VAT-adjusted values
                  const adjustedRevenue = category.revenue * 0.9; // Minus 10% VAT
                  const adjustedProfit = adjustedRevenue - category.cost;
                  const adjustedMargin = adjustedRevenue > 0 ? (adjustedProfit / adjustedRevenue) * 100 : 0;
                  
                  return (
                    <tr key={category.category} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {category.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatCurrency(adjustedRevenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                        {formatCurrency(category.cost)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        {formatCurrency(adjustedProfit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {adjustedMargin.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {category.quantity}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );


  const renderComparative = () => {
    // Calculate metrics for comparison
    const currentPeriod = data.currentPeriod || {};
    const comparisonPeriod = data.comparisonPeriod || {};
    const growthAnalysis = data.growthAnalysis || {};

    // Use actual cost and profit data from backend, with VAT-adjusted revenue
    const currentRevenue = (currentPeriod.totalRevenue || 0) * 0.9; // Minus 10% VAT
    const comparisonRevenue = (comparisonPeriod.totalRevenue || 0) * 0.9; // Minus 10% VAT
    const currentCost = currentPeriod.totalCost || 0;
    const comparisonCost = comparisonPeriod.totalCost || 0;
    const currentProfit = currentRevenue - currentCost;
    const comparisonProfit = comparisonRevenue - comparisonCost;
    const currentMargin = currentRevenue > 0 ? (currentProfit / currentRevenue) * 100 : 0;
    const comparisonMargin = comparisonRevenue > 0 ? (comparisonProfit / comparisonRevenue) * 100 : 0;

    // Calculate changes
    const revenueChange = currentRevenue - comparisonRevenue;
    const costChange = currentCost - comparisonCost;
    const profitChange = currentProfit - comparisonProfit;
    const marginChange = currentMargin - comparisonMargin;

    // Calculate percentage differences
    const revenuePercentChange = comparisonRevenue > 0 ? (revenueChange / comparisonRevenue) * 100 : 0;
    const costPercentChange = comparisonCost > 0 ? (costChange / comparisonCost) * 100 : 0;
    const profitPercentChange = comparisonProfit > 0 ? (profitChange / comparisonProfit) * 100 : 0;

    const comparisonData = [
      {
        metric: 'Total Sales',
        period1: formatCurrency(comparisonRevenue),
        period2: formatCurrency(currentRevenue),
        change: formatCurrency(revenueChange),
        percentChange: revenuePercentChange
      },
      {
        metric: 'Cost',
        period1: formatCurrency(comparisonCost),
        period2: formatCurrency(currentCost),
        change: formatCurrency(costChange),
        percentChange: costPercentChange
      },
      {
        metric: 'Net Profit',
        period1: formatCurrency(comparisonProfit),
        period2: formatCurrency(currentProfit),
        change: formatCurrency(profitChange),
        percentChange: profitPercentChange
      },
      {
        metric: 'Profit Margin',
        period1: `${comparisonMargin.toFixed(1)}%`,
        period2: `${currentMargin.toFixed(1)}%`,
        change: `${marginChange.toFixed(1)}%`,
        percentChange: '—'
      }
    ];

    return (
      <div className="space-y-6">
        {/* Comparison Type Selector */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparison Settings</h3>
          
          {/* Quick Filters */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Filters</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => handleComparisonTypeChange('today_vs_yesterday')}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  comparisonType === 'today_vs_yesterday'
                    ? 'bg-green-100 text-green-700 border-2 border-green-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                }`}
              >
                Today vs Yesterday
              </button>
              <button
                onClick={() => handleComparisonTypeChange('week_vs_last_week')}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  comparisonType === 'week_vs_last_week'
                    ? 'bg-green-100 text-green-700 border-2 border-green-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                }`}
              >
                This Week vs Last Week
              </button>
              <button
                onClick={() => handleComparisonTypeChange('month_vs_last_month')}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  comparisonType === 'month_vs_last_month'
                    ? 'bg-green-100 text-green-700 border-2 border-green-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                }`}
              >
                This Month vs Last Month
              </button>
              <button
                onClick={() => handleComparisonTypeChange('year_vs_last_year')}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  comparisonType === 'year_vs_last_year'
                    ? 'bg-green-100 text-green-700 border-2 border-green-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                }`}
              >
                This Year vs Last Year
              </button>
            </div>
          </div>

          {/* Custom Period Selection */}
          {comparisonType === 'custom' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Period 1 */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Period 1</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={comparisonPeriods.period1.startDate}
                        onChange={(e) => handleComparisonPeriodChange('period1', 'startDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={comparisonPeriods.period1.endDate}
                        onChange={(e) => handleComparisonPeriodChange('period1', 'endDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Period 2 */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Period 2</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={comparisonPeriods.period2.startDate}
                        onChange={(e) => handleComparisonPeriodChange('period2', 'startDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={comparisonPeriods.period2.endDate}
                        onChange={(e) => handleComparisonPeriodChange('period2', 'endDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Period Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-900 mb-2">Period Summary</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Period 1: </span>
                    <span className="text-gray-600">
                      {comparisonPeriods.period1.startDate && comparisonPeriods.period1.endDate
                        ? `${comparisonPeriods.period1.startDate} → ${comparisonPeriods.period1.endDate}`
                        : 'Select dates'
                      }
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Period 2: </span>
                    <span className="text-gray-600">
                      {comparisonPeriods.period2.startDate && comparisonPeriods.period2.endDate
                        ? `${comparisonPeriods.period2.startDate} → ${comparisonPeriods.period2.endDate}`
                        : 'Select dates'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Period Comparison</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Metric
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {comparisonType === 'today_vs_yesterday' 
                      ? 'Yesterday'
                    : comparisonType === 'week_vs_last_week'
                      ? 'Last Week'
                    : comparisonType === 'month_vs_last_month'
                      ? 'Last Month'
                    : comparisonType === 'year_vs_last_year'
                      ? 'Last Year'
                    : 'Previous Period'
                    }
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {comparisonType === 'today_vs_yesterday' 
                      ? 'Today'
                    : comparisonType === 'week_vs_last_week'
                      ? 'This Week'
                    : comparisonType === 'month_vs_last_month'
                      ? 'This Month'
                    : comparisonType === 'year_vs_last_year'
                      ? 'This Year'
                    : 'Current Period'
                    }
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Change
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    % Difference
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {comparisonData.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {row.metric}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      row.metric === 'Profit Margin' 
                        ? parseFloat(row.period1.replace(/[$,%]/g, '')) >= 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                        : 'text-gray-500'
                    }`}>
                      {row.period1}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      row.metric === 'Profit Margin' 
                        ? parseFloat(row.period2.replace(/[$,%]/g, '')) >= 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                        : 'text-gray-500'
                    }`}>
                      {row.period2}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      row.metric === 'Profit Margin' 
                        ? parseFloat(row.change.replace(/[$,%]/g, '')) >= 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                        : parseFloat(row.change.replace(/[$,]/g, '')) >= 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                    }`}>
                      {row.change}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      row.percentChange === '—' 
                        ? 'text-gray-500'
                        : parseFloat(row.percentChange) >= 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                    }`}>
                      {row.percentChange === '—' ? '—' : 
                       parseFloat(row.percentChange) >= 0 ? `+${row.percentChange.toFixed(1)}%` : `${row.percentChange.toFixed(1)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Comparison Chart */}
        {data.currentPeriod && data.comparisonPeriod && (
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Period Comparison Chart</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                {
                  name: comparisonType === 'today_vs_yesterday' 
                    ? 'Yesterday'
                  : comparisonType === 'week_vs_last_week'
                    ? 'Last Week'
                  : comparisonType === 'month_vs_last_month'
                    ? 'Last Month'
                  : comparisonType === 'year_vs_last_year'
                    ? 'Last Year'
                  : 'Previous Period',
                  revenue: comparisonRevenue,
                  orders: comparisonPeriod.totalOrders || 0,
                  items: comparisonPeriod.totalItems || 0
                },
                {
                  name: comparisonType === 'today_vs_yesterday' 
                    ? 'Today'
                  : comparisonType === 'week_vs_last_week'
                    ? 'This Week'
                  : comparisonType === 'month_vs_last_month'
                    ? 'This Month'
                  : comparisonType === 'year_vs_last_year'
                    ? 'This Year'
                  : 'Current Period',
                  revenue: currentRevenue,
                  orders: currentPeriod.totalOrders || 0,
                  items: currentPeriod.totalItems || 0
                }
              ]}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value, name) => [
                  name === 'revenue' ? formatCurrency(value) : value,
                  name === 'revenue' ? 'Revenue' : name === 'orders' ? 'Orders' : 'Items'
                ]} />
                <Bar dataKey="revenue" fill="#0088FE" name="Revenue" />
                <Bar dataKey="orders" fill="#00C49F" name="Orders" />
                <Bar dataKey="items" fill="#FFBB28" name="Items" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

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
      case 'comparative':
        return renderComparative();
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
        subtitle="Revenue, costs, profit analysis, and period comparisons"
        hideDateRange={activeReport === 'comparative'}
      />

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