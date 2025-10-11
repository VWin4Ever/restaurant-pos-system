import React, { useCallback, useMemo } from 'react';
import MultiSelectFilter from '../common/MultiSelectFilter';

const ReportsFilter = ({ 
  dateRange, 
  onDateRangeChange, 
  customDateRange, 
  onCustomDateChange,
  onExport,
  onShowExportModal,
  title,
  subtitle,
  hideDateRange = false,
  // Additional filters
  filters,
  onFilterChange,
  cashiers,
  shifts,
  products,
  categories,
  showFilters = false,
  // Cashier-specific filters
  showCashierFilters = false,
  staffMembers = [],
  selectedStaff = [],
  selectedShift = [],
  onStaffChange,
  onShiftChange
}) => {
  const dateRangeOptions = useMemo(() => [
    { value: 'all', label: 'All' },
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

  // Debug logging
  React.useEffect(() => {
    if (showFilters) {
      console.log('Filter options received:', { 
        cashiers: cashiers?.length || 0,
        shifts: shifts?.length || 0,
        categories: categories?.length || 0,
        products: products?.length || 0
      });
    }
  }, [showFilters, cashiers, shifts, categories, products]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600 mt-2">{subtitle}</p>
        </div>
        
        {/* Date Range Controls */}
        {!hideDateRange && (
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
          </div>
        )}

        {/* Export Controls */}
        {onShowExportModal && (
          <div className="mt-4 lg:mt-0 flex space-x-3">
            <button
              onClick={onShowExportModal}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Report
            </button>
          </div>
        )}
      </div>

      {/* Additional Filters Section */}
      {showFilters && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Cashier Multi-Select Filter */}
            {cashiers && cashiers.length > 0 && (
              <MultiSelectFilter
                label="Cashier"
                icon="👤"
                options={cashiers}
                selectedIds={filters?.cashierIds || []}
                onChange={(ids) => onFilterChange('cashierIds', ids)}
                placeholder="Select cashiers..."
                colorClass="blue"
              />
            )}

            {/* Shift Multi-Select Filter */}
            {shifts && shifts.length > 0 && (
              <MultiSelectFilter
                label="Shift"
                icon="⏰"
                options={shifts}
                selectedIds={filters?.shiftIds || []}
                onChange={(ids) => onFilterChange('shiftIds', ids)}
                placeholder="Select shifts..."
                colorClass="green"
              />
            )}

            {/* Category Multi-Select Filter */}
            {categories && categories.length > 0 && (
              <MultiSelectFilter
                label="Category"
                icon="🍺"
                options={categories}
                selectedIds={filters?.categoryIds || []}
                onChange={(ids) => onFilterChange('categoryIds', ids)}
                placeholder="Select categories..."
                colorClass="purple"
              />
            )}

            {/* Product Multi-Select Filter */}
            {products && products.length > 0 && (
              <MultiSelectFilter
                label="Product"
                icon="🍽️"
                options={products}
                selectedIds={filters?.productIds || []}
                onChange={(ids) => onFilterChange('productIds', ids)}
                placeholder="Select products..."
                colorClass="orange"
              />
            )}
          </div>

          {/* Active Filters Summary */}
          {filters && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {(() => {
                  const totalFilters = 
                    (filters.cashierIds?.length || 0) + 
                    (filters.shiftIds?.length || 0) + 
                    (filters.categoryIds?.length || 0) + 
                    (filters.productIds?.length || 0);
                  
                  if (totalFilters === 0) {
                    return <span>No filters applied - showing all data</span>;
                  }
                  
                  const filterParts = [];
                  if (filters.cashierIds?.length > 0) filterParts.push(`${filters.cashierIds.length} cashier(s)`);
                  if (filters.shiftIds?.length > 0) filterParts.push(`${filters.shiftIds.length} shift(s)`);
                  if (filters.categoryIds?.length > 0) filterParts.push(`${filters.categoryIds.length} category(ies)`);
                  if (filters.productIds?.length > 0) filterParts.push(`${filters.productIds.length} product(s)`);
                  
                  return <span>Filtering by: <strong>{filterParts.join(', ')}</strong></span>;
                })()}
              </div>
              
              {(filters.cashierIds?.length > 0 || filters.shiftIds?.length > 0 || 
                filters.categoryIds?.length > 0 || filters.productIds?.length > 0) && (
                <button
                  onClick={() => {
                    onFilterChange('cashierIds', []);
                    onFilterChange('shiftIds', []);
                    onFilterChange('categoryIds', []);
                    onFilterChange('productIds', []);
                  }}
                  className="text-sm text-red-600 hover:text-red-800 font-medium flex items-center"
                >
                  <span className="mr-1">🗑️</span>
                  Clear All Filters
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Cashier-Specific Filters Section */}
      {showCashierFilters && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cashier Multi-Select Filter */}
            {staffMembers && staffMembers.length > 0 && (
              <MultiSelectFilter
                label="Cashier"
                icon="👤"
                options={staffMembers.map(staff => ({
                  id: staff.id,
                  name: staff.name
                }))}
                selectedIds={selectedStaff}
                onChange={onStaffChange}
                placeholder="Select cashiers..."
                colorClass="blue"
              />
            )}

            {/* Shift Multi-Select Filter */}
            {shifts && shifts.length > 0 && (
              <MultiSelectFilter
                label="Shift"
                icon="⏰"
                options={shifts.map(shift => ({
                  id: shift.id,
                  name: `${shift.name} (${shift.startTime} - ${shift.endTime})`
                }))}
                selectedIds={selectedShift}
                onChange={onShiftChange}
                placeholder="Select shifts..."
                colorClass="purple"
              />
            )}
          </div>

          {/* Active Cashier Filters Summary */}
          {(selectedStaff.length > 0 || selectedShift.length > 0) && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {(() => {
                  const filterParts = [];
                  if (selectedStaff.length > 0) filterParts.push(`${selectedStaff.length} cashier(s)`);
                  if (selectedShift.length > 0) filterParts.push(`${selectedShift.length} shift(s)`);
                  
                  return <span>Filtering by: <strong>{filterParts.join(', ')}</strong></span>;
                })()}
              </div>
              
              <button
                onClick={() => {
                  onStaffChange([]);
                  onShiftChange([]);
                }}
                className="text-sm text-red-600 hover:text-red-800 font-medium flex items-center"
              >
                <span className="mr-1">🗑️</span>
                Clear Filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportsFilter;
