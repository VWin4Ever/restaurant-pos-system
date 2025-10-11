import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Navigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import ReportsFilter from './ReportsFilter';
import ExportModal from './ExportModal';
import { useAuth } from '../../contexts/AuthContext';

const SalesReports = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeReport, setActiveReport] = useState('summary');
  const [data, setData] = useState({});
  const [loading, setLocalLoading] = useState(false);
  const [dateRange, setDateRange] = useState('today');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  
  // Additional filters state (arrays for multi-select)
  const [filters, setFilters] = useState({
    cashierIds: [],
    shiftIds: [],
    categoryIds: [],
    productIds: []
  });
  
  // Filter options data
  const [filterOptions, setFilterOptions] = useState({
    cashiers: [],
    shifts: [],
    categories: [],
    products: []
  });

  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false);

  // Available sections for export
  const availableSections = [
    { id: 'summary', name: 'Sales Summary', icon: '📊', description: 'Revenue, orders, and key metrics' },
    { id: 'payment-methods', name: 'Payment Summary', icon: '💳', description: 'Payment methods and currency breakdown' },
    { id: 'discounts', name: 'Discounts', icon: '🎫', description: 'Discount impact on revenue' },
    { id: 'menu-performance', name: 'Menu Performance', icon: '🍽️', description: 'Best and worst selling items' },
    { id: 'category-sales', name: 'Category Sales', icon: '🍺', description: 'Performance by menu categories' },
    { id: 'table-performance', name: 'Table Performance', icon: '🪑', description: 'Revenue by table analysis' },
    { id: 'peak-hours', name: 'Peak Hours', icon: '⏰', description: 'Busiest times and patterns' }
  ];

  // Role-based sales reports - reorganized by logical grouping
  const isCashier = user?.role === 'CASHIER';
  const reports = isCashier ? [
    // Financial Overview
    { id: 'summary', name: 'Sales Summary', icon: '📊' },
    { id: 'payment-methods', name: 'Payment Summary', icon: '💳' },
    { id: 'discounts', name: 'Discounts', icon: '🎫' },
    // Operational Performance
    { id: 'menu-performance', name: 'Menu Performance', icon: '🍽️' },
    { id: 'category-sales', name: 'Category Sales', icon: '🍺' },
    { id: 'peak-hours', name: 'Peak Hours', icon: '⏰' }
  ] : [
    // Financial Overview
    { id: 'summary', name: 'Sales Summary', icon: '📊' },
    { id: 'payment-methods', name: 'Payment Summary', icon: '💳' },
    { id: 'discounts', name: 'Discounts', icon: '🎫' },
    // Operational Performance
    { id: 'menu-performance', name: 'Menu Performance', icon: '🍽️' },
    { id: 'category-sales', name: 'Category Sales', icon: '🍺' },
    { id: 'table-performance', name: 'Table Performance', icon: '🪑' },
    { id: 'peak-hours', name: 'Peak Hours', icon: '⏰' }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

  // Fetch filter options on component mount
  useEffect(() => {
    if (user) {
      fetchFilterOptions();
    }
  }, [user]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchReportData();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [activeReport, dateRange, customDateRange.startDate, customDateRange.endDate, filters]);

  const fetchFilterOptions = async () => {
    try {
      // Fetch cashiers (only for admins)
      if (user?.role === 'ADMIN') {
        const cashiersResponse = await axios.get('/api/users/cashiers/list');
        console.log('Cashiers response:', cashiersResponse.data);
        if (cashiersResponse.data?.success && cashiersResponse.data.data) {
          const cashierUsers = Array.isArray(cashiersResponse.data.data) ? cashiersResponse.data.data : [];
          console.log('Cashiers loaded:', cashierUsers.length);
          setFilterOptions(prev => ({
            ...prev,
            cashiers: cashierUsers
          }));
        }
      }

      // Fetch shifts
      const shiftsResponse = await axios.get('/api/shifts');
      if (shiftsResponse.data?.success && shiftsResponse.data.data) {
        setFilterOptions(prev => ({
          ...prev,
          shifts: Array.isArray(shiftsResponse.data.data) ? shiftsResponse.data.data : []
        }));
      }

      // Fetch categories
      const categoriesResponse = await axios.get('/api/categories');
      if (categoriesResponse.data?.success && categoriesResponse.data.data) {
        setFilterOptions(prev => ({
          ...prev,
          categories: Array.isArray(categoriesResponse.data.data) ? categoriesResponse.data.data : []
        }));
      }

      // Fetch products
      const productsResponse = await axios.get('/api/products');
      if (productsResponse.data?.success && productsResponse.data.data) {
        setFilterOptions(prev => ({
          ...prev,
          products: Array.isArray(productsResponse.data.data) ? productsResponse.data.data : []
        }));
      }

      // Debug: Log final filter options
      console.log('All filter options loaded successfully');
    } catch (error) {
      console.error('Error fetching filter options:', error);
      // Set empty arrays on error to prevent undefined errors
      setFilterOptions({
        cashiers: [],
        shifts: [],
        categories: [],
        products: []
      });
    }
  };

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

      // Add filter parameters (arrays)
      if (filters.cashierIds?.length > 0) {
        filters.cashierIds.forEach(id => params.append('cashierIds[]', id));
      }
      if (filters.shiftIds?.length > 0) {
        filters.shiftIds.forEach(id => params.append('shiftIds[]', id));
      }
      if (filters.categoryIds?.length > 0) {
        filters.categoryIds.forEach(id => params.append('categoryIds[]', id));
      }
      if (filters.productIds?.length > 0) {
        filters.productIds.forEach(id => params.append('productIds[]', id));
      }

      // Use cashier-specific endpoints for cashiers
      const endpoint = isCashier ? `/api/reports/cashier-${activeReport}` : `/api/reports/sales/${activeReport}`;
      console.log('Fetching from endpoint:', endpoint);
      console.log('Filters applied:', filters);
      console.log('Query params:', params.toString());
      const response = await axios.get(`${endpoint}?${params}`);
      console.log('Frontend received data:', response.data);
      
      if (response.data && response.data.success) {
        console.log('Payment Summary data received:', response.data.data);
        console.log('Riel breakdown:', response.data.data.rielBreakdown);
        console.log('USD breakdown:', response.data.data.usdBreakdown);
        setData(response.data.data || {});
      } else {
        console.warn('API response indicates failure:', response.data);
        setData({});
      }
    } catch (error) {
      console.error('Failed to fetch report data:', error);
      toast.error('Failed to load report data');
      // Set empty data on error to show empty state
      setData({});
    } finally {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
      
      setTimeout(() => {
        setLocalLoading(false);
      }, remainingTime);
    }
  }, [activeReport, dateRange, customDateRange.startDate, customDateRange.endDate, isCashier, filters]);

  const exportReport = useCallback(async (format = 'pdf', selectedSections = []) => {
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
      
      // Add selected sections
      if (selectedSections.length > 0) {
        selectedSections.forEach(section => params.append('sections[]', section));
      }
      
      // Add filter parameters to export (arrays)
      if (filters.cashierIds?.length > 0) {
        filters.cashierIds.forEach(id => params.append('cashierIds[]', id));
      }
      if (filters.shiftIds?.length > 0) {
        filters.shiftIds.forEach(id => params.append('shiftIds[]', id));
      }
      if (filters.categoryIds?.length > 0) {
        filters.categoryIds.forEach(id => params.append('categoryIds[]', id));
      }
      if (filters.productIds?.length > 0) {
        filters.productIds.forEach(id => params.append('productIds[]', id));
      }

      // Use comprehensive export endpoint with cache-busting
      const endpoint = isCashier ? `/api/reports/cashier-comprehensive/export` : `/api/reports/sales/comprehensive/export`;
      const cacheBuster = `&_t=${Date.now()}`;
      const response = await axios.get(`${endpoint}?${params}${cacheBuster}`, {
        responseType: 'blob'
      });
      
      if (!response.data || response.data.size === 0) {
        toast.error('No data available for export');
        return;
      }
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Generate unique filename with timestamp to prevent caching
      const timestamp = Date.now();
      const dateString = new Date().toISOString().split('T')[0];
      const fileExtension = format === 'excel' ? 'csv' : format;
      const uniqueFilename = `sales-report-${dateRange}-${dateString}-${timestamp}.${fileExtension}`;
      
      link.setAttribute('download', uniqueFilename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      window.URL.revokeObjectURL(url);
      
      toast.success(`Report exported successfully as ${format.toUpperCase()}!`);
    } catch (error) {
      console.error('Failed to export report:', error);
      toast.error('Failed to export report. Please try again.');
    }
  }, [dateRange, customDateRange.startDate, customDateRange.endDate, isCashier, filters]);

  const handleDateRangeChange = useCallback((value) => {
    setDateRange(value);
    if (value !== 'custom') {
      setCustomDateRange({ startDate: '', endDate: '' });
    }
  }, []);

  const handleCustomDateChange = useCallback((field, value) => {
    setCustomDateRange(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const formatCurrency = useCallback((amount, currency = 'USD') => {
    if (currency === 'Riel') {
      // Display Riel amounts as Riel (amount is already in Riel)
      return new Intl.NumberFormat('km-KH', {
        style: 'currency',
        currency: 'KHR'
      }).format(amount);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }, []);

  const renderSalesSummary = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Revenue</p>
              <p className="text-3xl font-bold">
                {formatCurrency(data.totalRevenue || 0)}
              </p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Orders</p>
              <p className="text-3xl font-bold">
                {data.totalOrders || 0}
              </p>
            </div>
            <div className="text-4xl">📋</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Items Sold</p>
              <p className="text-3xl font-bold">
                {data.totalItems || 0}
              </p>
            </div>
            <div className="text-4xl">🍽️</div>
          </div>
        </div>

        <div className="bg-orange-50 p-6 rounded-xl">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-orange-600">Avg Order</p>
              <p className="text-2xl font-bold text-orange-900">
                {formatCurrency(data.averageOrder || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Chart */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Trend</h3>
        {data.dailySales && data.dailySales.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.dailySales}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-2">📈</div>
              <p>No sales data for the selected period</p>
            </div>
          </div>
        )}
      </div>

      {/* Order List */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">All Orders</h3>
        {data.orders && data.orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.user?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.orderItems?.length || 0} items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(order.total, 'USD')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 text-center text-sm text-gray-500">
              Showing {data.orders.length} order{data.orders.length !== 1 ? 's' : ''}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[200px] text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-2">📋</div>
              <p>No orders found for the selected period</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderPaymentMethods = () => {
    console.log('Rendering Payment Methods with data:', data);
    console.log('Riel breakdown available:', !!data.rielBreakdown);
    console.log('USD breakdown available:', !!data.usdBreakdown);
    
    return (
    <div className="space-y-6">
      {/* Currency Breakdown Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Riel Money Card */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm opacity-90">Riel Money</p>
              <p className="text-2xl font-bold">៛</p>
            </div>
            <div className="text-4xl">🇰🇭</div>
          </div>
          
          {data.rielBreakdown ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm opacity-90">Total:</span>
                <span className="font-bold">{formatCurrency(data.rielBreakdown.total, 'Riel')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm opacity-90">💵 Cash:</span>
                <span className="font-bold">{formatCurrency(data.rielBreakdown.cash, 'Riel')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm opacity-90">💳 Card:</span>
                <span className="font-bold">{formatCurrency(data.rielBreakdown.card, 'Riel')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm opacity-90">📱 QR:</span>
                <span className="font-bold">{formatCurrency(data.rielBreakdown.qr, 'Riel')}</span>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm opacity-75">No Riel payments</p>
            </div>
          )}
        </div>

        {/* USD Money Card */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm opacity-90">USD Money</p>
              <p className="text-2xl font-bold">$</p>
            </div>
            <div className="text-4xl">🇺🇸</div>
          </div>
          
          {data.usdBreakdown ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm opacity-90">Total:</span>
                <span className="font-bold">{formatCurrency(data.usdBreakdown.total, 'USD')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm opacity-90">💵 Cash:</span>
                <span className="font-bold">{formatCurrency(data.usdBreakdown.cash, 'USD')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm opacity-90">💳 Card:</span>
                <span className="font-bold">{formatCurrency(data.usdBreakdown.card, 'USD')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm opacity-90">📱 QR:</span>
                <span className="font-bold">{formatCurrency(data.usdBreakdown.qr, 'USD')}</span>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm opacity-75">No USD payments</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Method Summary */}
      {data.paymentMethods && data.paymentMethods.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Method Cards */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">💳</span>
              Payment Method & Currency Breakdown
            </h3>
            <div className="space-y-4">
              {data.paymentMethods.map((method, index) => (
                <div key={`${method.method}_${method.currency}`} className="border-l-4 pl-4 py-3" style={{ borderColor: COLORS[index % COLORS.length] }}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      <span className="text-xl mr-2">
                        {method.method === 'CASH' ? '💵' : 
                         method.method === 'CARD' ? '💳' : 
                         method.method === 'CREDIT_CARD' ? '💳' : 
                         method.method === 'DEBIT_CARD' ? '💳' : 
                         method.method === 'QR' ? '📱' : '💰'}
                      </span>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {method.method} {method.currency && `(${method.currency})`}
                        </p>
                        <p className="text-sm text-gray-500">{method.count} orders</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(method.revenue, method.currency)}</p>
                      <p className="text-sm text-gray-500">{method.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${method.percentage}%`,
                        backgroundColor: COLORS[index % COLORS.length]
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Method Pie Chart */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.paymentMethods}
                  dataKey="revenue"
                  nameKey="method"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.method}: ${entry.percentage.toFixed(1)}%`}
                >
                  {data.paymentMethods.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-xl shadow-lg text-center">
          <div className="text-6xl mb-4">💳</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Payment Data</h3>
          <p className="text-gray-500">No payment transactions found for the selected period.</p>
        </div>
      )}

      {/* Payment Method Details Table */}
      {data.paymentMethods && data.paymentMethods.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Detailed Payment & Currency Analysis</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Currency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg per Order</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.paymentMethods.map((method, index) => (
                  <tr key={`${method.method}_${method.currency}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-xl mr-2">
                          {method.method === 'CASH' ? '💵' : 
                           method.method === 'CARD' ? '💳' : 
                           method.method === 'CREDIT_CARD' ? '💳' : 
                           method.method === 'DEBIT_CARD' ? '💳' : 
                           method.method === 'QR' ? '📱' : '💰'}
                        </span>
                        <span className="font-medium text-gray-900">{method.method}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {method.currency || 'USD'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">{method.count}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                      {formatCurrency(method.revenue, method.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full" 
                            style={{ 
                              backgroundColor: `${COLORS[index % COLORS.length]}20`,
                              color: COLORS[index % COLORS.length]
                            }}>
                        {method.percentage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {formatCurrency(method.count > 0 ? method.revenue / method.count : 0, method.currency)}
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
  };

  const renderMenuPerformance = () => (
    <div className="space-y-6">
      {/* Filter Info */}
      {filters.productIds && filters.productIds.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-orange-600 text-lg mr-2">🍽️</span>
            <div>
              <p className="text-orange-800 font-medium">Filtered by Products</p>
              <p className="text-orange-600 text-sm">
                Showing performance for {filters.productIds.length} selected product(s)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Items Chart */}
      {data.topItems && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Items</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data.topItems}>
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="revenue" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Items Table */}
      {data.items && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Menu Performance Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity Sold</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Price</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.items.map((item) => (
                  <tr key={item.id} className={`hover:bg-gray-50 ${item.quantity === 0 ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.name}
                      {item.quantity === 0 && (
                        <span className="ml-2 text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                          No Sales
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(item.revenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(item.averagePrice)}
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
      {data.peakHours && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-red-50 p-6 rounded-xl">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <span className="text-2xl">🔥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-red-600">Peak Hours</p>
                <p className="text-2xl font-bold text-red-900">
                  {data.peakHours.peak || 'N/A'}
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
                <p className="text-sm font-medium text-blue-600">Avg Hourly Revenue</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(data.peakHours.average || 0)}
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
                <p className="text-sm font-medium text-orange-600">Slow Hours</p>
                <p className="text-2xl font-bold text-orange-900">
                  {data.peakHours.slow || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hourly Chart */}
      {data.hourlySales && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hourly Sales Pattern</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.hourlySales}>
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="revenue" fill="#FFBB28" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );

  const renderTablePerformance = () => (
    <div className="space-y-6">
      {/* Table Performance Chart */}
      {data.tableSales && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Table</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.tableSales}>
              <XAxis dataKey="tableNumber" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="revenue" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table Details */}
      {data.tableDetails && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Table Performance Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Table</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilization</th>
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
                      {formatCurrency(table.averageOrder)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {table.utilization}%
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

  const renderCategorySales = () => (
    <div className="space-y-6">
      {/* Category Chart */}
      {data.categorySales && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.categorySales}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {data.categorySales?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h3>
            <div className="space-y-4">
              {data.categorySales?.map((category, index) => (
                <div key={category.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded mr-3"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(category.revenue)}</div>
                    <div className="text-sm text-gray-500">{category.quantity} items</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderDiscounts = () => (
    <div className="space-y-6">
              {/* Discount Summary */}
        {data.discountSummary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-xl shadow-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Discounts</p>
                  <p className="text-3xl font-bold">
                    {data.discountSummary.totalDiscounts || 0}
                  </p>
                </div>
                <div className="text-4xl">🎫</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Amount</p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(data.discountSummary.totalAmount || 0)}
                  </p>
                </div>
                <div className="text-4xl">💰</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Avg Discount</p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(data.discountSummary.averageDiscount || 0)}
                  </p>
                </div>
                <div className="text-4xl">📊</div>
              </div>
            </div>

          <div className="bg-purple-50 p-6 rounded-xl">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <span className="text-2xl">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">Staff Involved</p>
                <p className="text-2xl font-bold text-purple-900">
                  {data.discountSummary.staffCount || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Discount Details */}
      {data.discountDetails && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Discount Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount (%)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.discountDetails?.map((discount) => (
                  <tr key={discount.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {discount.orderNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(discount.date).toLocaleDateString()} {new Date(discount.date).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {discount.staffName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {discount.discountPercentage ? discount.discountPercentage.toFixed(1) + '%' : '0.0%'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      -{formatCurrency(discount.amount)}
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
      <div className="text-6xl mb-4">📊</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No Sales Data Available</h3>
      <p className="text-gray-500 mb-4">
        There's no sales data to display for the selected period and report type.
      </p>
      <div className="text-sm text-gray-400 mb-6">
        Try selecting a different period or report type.
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
        <p className="text-blue-800 text-sm">
          <strong>Tip:</strong> Make sure you have created some orders to see sales data.
        </p>
      </div>
    </div>
  );

  const renderReportContent = () => {
    // Always show the report content, even with zero data
    // Only show empty state if there's a genuine error or no response
    const hasError = loading === false && Object.keys(data).length === 0 && (data.error || data.message);

    if (hasError) {
      return renderEmptyState();
    }

    // For zero data, show the report with zero values instead of empty state
    // This ensures users see the report structure even when there's no sales data

    switch (activeReport) {
      case 'summary':
        return renderSalesSummary();
      case 'payment-methods':
        return renderPaymentMethods();
      case 'menu-performance':
        return renderMenuPerformance();
      case 'peak-hours':
        return renderPeakHours();
      case 'table-performance':
        return renderTablePerformance();
      case 'category-sales':
        return renderCategorySales();
      case 'discounts':
        return renderDiscounts();
      default:
        return renderSalesSummary();
    }
  };

  // Show loading spinner while authentication is being checked
  if (authLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If no user is found, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="space-y-6">
      {/* Filter Header */}
      <ReportsFilter
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        customDateRange={customDateRange}
        onCustomDateChange={handleCustomDateChange}
        onShowExportModal={() => setShowExportModal(true)}
        title="Sales Reports"
        subtitle="Revenue, orders, and menu performance analysis"
        showFilters={!isCashier}
        filters={filters}
        onFilterChange={handleFilterChange}
        cashiers={filterOptions.cashiers}
        shifts={filterOptions.shifts}
        categories={filterOptions.categories}
        products={filterOptions.products}
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

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={exportReport}
        reportType="Sales Reports"
        availableSections={availableSections}
      />
    </div>
  );
};

export default SalesReports; 