import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Icon from '../common/Icon';

const OrderFilters = ({ filters, onFiltersChange, onReset, showTodayOnly = false }) => {
  const [tables, setTables] = useState([]);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await axios.get('/api/tables');
      setTables(response.data.data);
    } catch (error) {
      console.error('Failed to fetch tables:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    onFiltersChange(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="card-gradient animate-slide-up p-0 md:p-0" style={{ animationDelay: '400ms' }}>
      {/* Header */}
      <div className="flex items-center px-4 pt-3 pb-1">
        <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-neutral-100 mr-2">
          <Icon name="filter" size="sm" className="text-primary-600" />
        </span>
        <div>
          <h3 className="text-xl font-bold text-primary-800 leading-tight">Filters</h3>
          {showTodayOnly && (
            <div className="text-xs text-primary-500 flex items-center space-x-1 mt-0.5">
              <Icon name="calendar" size="xs" />
              <span>Showing orders for today ({new Date().toLocaleDateString()})</span>
            </div>
          )}
        </div>
      </div>

      {/* Filters Grid (now includes date range) */}
      <div className="px-4 pb-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
          {/* Search */}
          <div>
            <label className="block text-xs font-semibold text-primary-700 mb-0.5">
              <Icon name="search" size="xs" className="inline-block mr-1 align-text-bottom" /> Search Order #
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search order number..."
              className="input w-full h-10 px-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-primary-200 text-sm"
            />
          </div>
          {/* Status Filter */}
          <div>
            <label className="block text-xs font-semibold text-primary-700 mb-0.5">
              <Icon name="info" size="xs" className="inline-block mr-1 align-text-bottom" /> Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="input w-full h-10 px-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-primary-200 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          {/* Table Filter */}
          <div>
            <label className="block text-xs font-semibold text-primary-700 mb-0.5">
              <Icon name="tables" size="xs" className="inline-block mr-1 align-text-bottom" /> Table
            </label>
            <select
              value={filters.tableId}
              onChange={(e) => handleFilterChange('tableId', e.target.value)}
              className="input w-full h-10 px-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-primary-200 text-sm"
            >
              <option value="">All Tables</option>
              {tables.map(table => (
                <option key={table.id} value={table.id}>
                  Table {table.number}
                </option>
              ))}
            </select>
          </div>
          {/* Start Date */}
          <div>
            <label className="block text-xs font-semibold text-primary-700 mb-0.5">
              <Icon name="calendar" size="xs" className="inline-block mr-1 align-text-bottom" /> Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="input w-full h-10 px-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-primary-200 text-sm"
            />
          </div>
          {/* End Date */}
          <div>
            <label className="block text-xs font-semibold text-primary-700 mb-0.5">
              <Icon name="calendar" size="xs" className="inline-block mr-1 align-text-bottom" /> End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="input w-full h-10 px-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-primary-200 text-sm"
            />
          </div>
          {/* Reset Button */}
          <div className="lg:col-span-5 md:col-span-3 sm:col-span-2 flex justify-end mt-1">
            <button
              onClick={onReset}
              className="btn-secondary flex items-center px-4 py-1.5 rounded-xl text-sm font-semibold shadow-sm"
            >
              <Icon name="refresh" size="xs" className="mr-2" />
              Reset Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderFilters; 