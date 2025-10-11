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
  const [staffMembers, setStaffMembers] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [selectedShift, setSelectedShift] = useState([]);

  // Role-based staff reports - reorganized by logical grouping
  const isCashier = user?.role === 'CASHIER';
  const reports = isCashier ? [
    // Personal Performance
    { id: 'performance', name: 'My Performance', icon: '📊' },
    { id: 'activity', name: 'My Activity', icon: '👥' },
    { id: 'attendance', name: 'My Attendance', icon: '📅' }
  ] : [
    // Staff Management - Performance is for Cashiers only
    { id: 'performance', name: 'Cashier Performance', icon: '📊' },
    { id: 'activity', name: 'Activity', icon: '👥' },
    { id: 'attendance', name: 'Attendance', icon: '📅' }
  ];

  const fetchStaffMembers = useCallback(async () => {
    try {
      const response = await axios.get('/api/users');
      // Filter to only cashiers for the performance report
      const cashiers = (response.data.data || []).filter(staff => staff.role === 'CASHIER');
      setStaffMembers(cashiers);
    } catch (error) {
      console.error('Failed to fetch cashiers:', error);
    }
  }, []);

  const fetchShifts = useCallback(async () => {
    try {
      const response = await axios.get('/api/shifts');
      setShifts(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch shifts:', error);
    }
  }, []);

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

      // Add filter parameters
      if (selectedStaff.length > 0) {
        selectedStaff.forEach(id => params.append('staffId', id));
      }
      if (selectedShift.length > 0) {
        selectedShift.forEach(id => params.append('shiftId', id));
      }

      // Use cashier-specific endpoints for cashiers
      const endpoint = isCashier ? `/api/reports/cashier-${activeReport}` : `/api/reports/staff/${activeReport}`;
      const response = await axios.get(`${endpoint}?${params}`);
      let reportData = response.data.data;


      setData(reportData);
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
  }, [activeReport, dateRange, customDateRange.startDate, customDateRange.endDate, selectedStaff, selectedShift, isCashier]);

  // Fetch staff members and shifts on mount
  useEffect(() => {
    fetchStaffMembers();
    fetchShifts();
  }, [fetchStaffMembers, fetchShifts]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchReportData();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [fetchReportData, activeReport, dateRange, customDateRange.startDate, customDateRange.endDate, selectedStaff, selectedShift]);

  const exportReport = useCallback(async (format = 'csv') => {
    try {
      toast.info('Preparing cashier performance export...');
      
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
      const fileExtension = format === 'excel' ? 'csv' : format;
      link.setAttribute('download', `cashier-${activeReport}-${dateRange}-${new Date().toISOString().split('T')[0]}.${fileExtension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      window.URL.revokeObjectURL(url);
      
      toast.success(`Cashier performance report exported successfully as ${format.toUpperCase()}!`);
    } catch (error) {
      console.error('Failed to export cashier report:', error);
      toast.error('Failed to export cashier report. Please try again.');
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

  const exportIndividualStaff = useCallback(async (staff) => {
    try {
      toast.info(`Exporting ${staff.name}'s cashier performance data...`);
      
      const params = new URLSearchParams();
      if (dateRange === 'custom') {
        params.append('startDate', customDateRange.startDate);
        params.append('endDate', customDateRange.endDate);
      } else {
        params.append('range', dateRange);
      }
      params.append('staffId', staff.id);
      params.append('format', 'csv');

      const response = await axios.get(`/api/reports/staff/performance/export?${params}`, {
        responseType: 'blob'
      });
      
      if (!response.data || response.data.size === 0) {
        toast.error('No data available for export');
        return;
      }
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${staff.name.replace(/\s+/g, '-')}-cashier-performance-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      window.URL.revokeObjectURL(url);
      
      toast.success(`${staff.name}'s cashier performance data exported successfully!`);
    } catch (error) {
      console.error('Failed to export individual cashier data:', error);
      toast.error('Failed to export cashier data. Please try again.');
    }
  }, [dateRange, customDateRange.startDate, customDateRange.endDate]);


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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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


      {/* Cashier Performance Insights */}
      {data.staffDetails && data.staffDetails.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-2xl mr-2">💡</span>
            Cashier Performance Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Top Cashier */}
            {(() => {
              const topCashier = data.staffDetails.reduce((max, staff) => 
                staff.sales > max.sales ? staff : max
              );
              return (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">🏆</span>
                    <h4 className="font-semibold text-gray-900">Top Cashier</h4>
                  </div>
                  <p className="text-sm text-gray-600">{topCashier.name}</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(topCashier.sales)}
                  </p>
                </div>
              );
            })()}

            {/* Most Active Cashier */}
            {(() => {
              const mostActive = data.staffDetails.reduce((max, staff) => 
                staff.orders > max.orders ? staff : max
              );
              return (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">⚡</span>
                    <h4 className="font-semibold text-gray-900">Most Active</h4>
                  </div>
                  <p className="text-sm text-gray-600">{mostActive.name}</p>
                  <p className="text-lg font-bold text-blue-600">
                    {mostActive.orders} orders
                  </p>
                </div>
              );
            })()}

            {/* Cashier Stats */}
            {(() => {
              const totalOrders = data.staffDetails.reduce((sum, staff) => sum + staff.orders, 0);
              const topCashier = data.staffDetails.reduce((max, staff) => 
                staff.orders > max.orders ? staff : max
              );
              const percentage = totalOrders > 0 ? Math.round((topCashier.orders / totalOrders) * 100) : 0;
              return (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">📊</span>
                    <h4 className="font-semibold text-gray-900">Cashier Stats</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    {topCashier.name} handled {percentage}% of all orders
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {totalOrders} total orders processed by cashiers
                  </p>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Staff Details with Enhanced Features */}
      {data.staffDetails && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Cashier Performance Details</h3>
            <p className="text-sm text-gray-500 mt-1">Performance metrics for cashier staff only</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cashier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sales</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(() => {
                  // Filter to show only Cashiers
                  const cashierStaff = data.staffDetails.filter(staff => staff.role === 'CASHIER');

                  // Sort by sales (descending)
                  const sortedStaff = [...cashierStaff].sort((a, b) => b.sales - a.sales);

                  // Find max values for progress bars
                  const maxSales = Math.max(...sortedStaff.map(s => s.sales));
                  const maxOrders = Math.max(...sortedStaff.map(s => s.orders));

                  return sortedStaff.map((staff, index) => {
                    const isTopPerformer = index === 0; // First cashier is top performer
                    
                    return (
                      <tr 
                        key={staff.id} 
                        className={`hover:bg-gray-50 ${isTopPerformer ? 'bg-green-50 border-l-4 border-green-500' : ''}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-lg mr-2">👤</span>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {staff.name}
                                {isTopPerformer && <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">🏆 Top</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{staff.orders}</div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${(staff.orders / maxOrders) * 100}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(staff.sales)}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${(staff.sales / maxSales) * 100}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`text-sm font-medium ${
                              staff.performance >= 80 ? 'text-green-600' :
                              staff.performance >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {staff.performance}%
                            </span>
                            <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  staff.performance >= 80 ? 'bg-green-500' :
                                  staff.performance >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(staff.performance, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => exportIndividualStaff(staff)}
                            className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md text-xs transition-colors"
                          >
                            📊 Export
                          </button>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderActivity = () => (
    <div className="space-y-6">
      {/* Per-Cashier Activity Metrics */}
      {data.staffActivity && data.staffActivity.length > 0 && (
        <div className="space-y-4">
          {data.staffActivity.map((cashier, index) => (
            <div key={cashier.name} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-lg">👤</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{cashier.name}</h3>
                    <p className="text-sm text-gray-500">Cashier Activity</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Orders Handled</p>
                  <p className="text-2xl font-bold text-blue-600">{cashier.orders || 0}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-green-600 font-medium">Total Sales</p>
                      <p className="text-lg font-bold text-green-700">
                        {formatCurrency(cashier.sales || 0)}
                      </p>
                    </div>
                    <span className="text-green-500 text-xl">💰</span>
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-orange-600 font-medium">Discounts</p>
                      <p className="text-lg font-bold text-orange-700">
                        {cashier.discounts || 0}
                      </p>
                    </div>
                    <span className="text-orange-500 text-xl">🎫</span>
                  </div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-red-600 font-medium">Cancelled</p>
                      <p className="text-lg font-bold text-red-700">
                        {cashier.cancelled || 0}
                      </p>
                    </div>
                    <span className="text-red-500 text-xl">❌</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Data Message */}
      {(!data.staffActivity || data.staffActivity.length === 0) && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Activity Data</h3>
          <p className="text-gray-500">No cashier activity found for the selected period.</p>
        </div>
      )}
    </div>
  );

  const renderAttendance = () => (
    <div className="space-y-6">
      {/* Attendance Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Staff Attendance</h3>
          <p className="text-sm text-gray-500 mt-1">Daily attendance tracking for all staff members</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Late</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overtime</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.attendance && data.attendance.length > 0 ? (
                data.attendance.map((record, index) => (
                  <tr key={`${record.staffId}-${record.date}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">👤</span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{record.staffName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.shift}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.checkIn || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.checkOut || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.totalHours || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.late || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.overtime || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        record.status === 'Present' 
                          ? 'bg-green-100 text-green-800' 
                          : record.status === 'Late'
                          ? 'bg-orange-100 text-orange-800'
                          : record.status === 'On Duty'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {record.status === 'Present' && '✅ Present'}
                        {record.status === 'Late' && '🟠 Late'}
                        {record.status === 'On Duty' && '🔵 On Duty'}
                        {record.status === 'Absent' && '🔴 Absent'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center">
                    <div className="text-gray-400 text-6xl mb-4">📅</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Attendance Data</h3>
                    <p className="text-gray-500">No attendance records found for the selected period.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
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
      case 'attendance':
        return renderAttendance();
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
        // Cashier-specific filters
        showCashierFilters={!isCashier}
        staffMembers={staffMembers}
        shifts={shifts}
        selectedStaff={selectedStaff}
        selectedShift={selectedShift}
        onStaffChange={setSelectedStaff}
        onShiftChange={setSelectedShift}
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

export default StaffReports; 