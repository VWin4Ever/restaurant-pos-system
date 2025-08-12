import React, { useCallback, useMemo } from 'react';

const ReportsFilter = ({ 
  dateRange, 
  onDateRangeChange, 
  customDateRange, 
  onCustomDateChange,
  onExport,
  title,
  subtitle 
}) => {
  const dateRangeOptions = useMemo(() => [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'week', label: 'This Week' },
    { value: 'lastWeek', label: 'Last Week' },
    { value: 'month', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'custom', label: 'Custom Range' }
  ], []);

  const getDateRangeLabel = useCallback(() => {
    if (dateRange === 'custom' && customDateRange.startDate && customDateRange.endDate) {
      return `${customDateRange.startDate} to ${customDateRange.endDate}`;
    }
    const option = dateRangeOptions.find(opt => opt.value === dateRange);
    return option ? option.label : 'Today';
  }, [dateRange, customDateRange, dateRangeOptions]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600 mt-2">{subtitle}</p>
        </div>
        
        {/* Date Range Controls */}
        <div className="mt-4 lg:mt-0 flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Period:</label>
            <select
              value={dateRange}
              onChange={(e) => onDateRangeChange(e.target.value)}
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
                onChange={(e) => onCustomDateChange('startDate', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={customDateRange.endDate}
                onChange={(e) => onCustomDateChange('endDate', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          )}

          <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
            Showing: <span className="font-medium">{getDateRangeLabel()}</span>
          </div>

          {/* Export Controls */}
          {onExport && (
            <div className="flex space-x-3">
              <button
                onClick={() => onExport('csv')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
              >
                📊 Export CSV
              </button>
              <button
                onClick={() => onExport('pdf')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
              >
                📄 Export PDF
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsFilter;
