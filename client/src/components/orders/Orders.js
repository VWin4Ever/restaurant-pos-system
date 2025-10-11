import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import CreateOrder from './CreateOrder';
import EditOrder from './EditOrder';
import OrderFilters from './OrderFilters';
import InvoiceModal from './InvoiceModal';
import SimpleReceiptModal from './SimpleReceiptModal';
import SplitReceiptManager from './SplitReceiptManager';
import PaymentPage from './PaymentPage';
import ConfirmDialog from '../common/ConfirmDialog';
import websocketService from '../../services/websocket';
import { useSettings } from '../../contexts/SettingsContext';
import Icon from '../common/Icon';

// 1. Add skeleton loader for orders table
const OrdersSkeleton = ({ rows = 5 }) => (
  <div className="space-y-4 p-6">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="animate-pulse bg-surface rounded-xl h-20 w-full" />
    ))}
  </div>
);

const Orders = () => {
  const { getTaxRate } = useSettings();
  const [allOrders, setAllOrders] = useState([]); // Store all orders for client-side filtering
  
  // Get VAT rate from order's business snapshot if available, otherwise use current settings
  const getOrderVATRate = (order) => {
    if (order?.businessSnapshot) {
      try {
        const snapshot = typeof order.businessSnapshot === 'string' 
          ? JSON.parse(order.businessSnapshot) 
          : order.businessSnapshot;
        return snapshot.vatRate || snapshot.taxRate || getTaxRate();
      } catch (error) {
        console.error('Failed to parse business snapshot:', error);
        return getTaxRate();
      }
    }
    return getTaxRate();
  };
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentPage, setShowPaymentPage] = useState(false);
  const [showSplitReceiptManager, setShowSplitReceiptManager] = useState(false);
  const [showSimpleReceipt, setShowSimpleReceipt] = useState(false);
  const [showDraftReceipt, setShowDraftReceipt] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showTodayOnly] = useState(true); // New state for toggle
  
  // Filter states (similar to Products)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedTable, setSelectedTable] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [timeFilter, setTimeFilter] = useState(''); // New time filter state
  const [sortBy] = useState('createdAt');
  const [sortOrder] = useState('desc');
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [confirmDialog, setConfirmDialog] = useState({ open: false });
  const [isMobile, setIsMobile] = useState(false);
  const [showFilters, setShowFilters] = useState(false);



  // Helper function to get date ranges for time filters
  const getTimeFilterRange = (filter) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filter) {
      case 'today':
        return {
          start: today,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
        };
      case 'thisWeek':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return {
          start: startOfWeek,
          end: new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)
        };
      case 'thisMonth':
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
        };
      case 'thisYear':
        return {
          start: new Date(now.getFullYear(), 0, 1),
          end: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
        };
      default:
        return null;
    }
  };

  // Client-side filtering logic (similar to Products)
  const filteredOrders = allOrders.filter(order => {
    // Search filter
    const matchesSearch = !searchTerm || 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const matchesStatus = !selectedStatus || order.status === selectedStatus;
    
    // Table filter
    const matchesTable = !selectedTable || order.tableId === parseInt(selectedTable);
    
    // Date range filter
    const orderDate = new Date(order.createdAt);
    const matchesStartDate = !startDate || orderDate >= new Date(startDate + 'T00:00:00.000Z');
    const matchesEndDate = !endDate || orderDate <= new Date(endDate + 'T23:59:59.999Z');
    
    // Time filter
    let matchesTimeFilter = true;
    if (timeFilter) {
      const timeRange = getTimeFilterRange(timeFilter);
      if (timeRange) {
        matchesTimeFilter = orderDate >= timeRange.start && orderDate <= timeRange.end;
      }
    }
    
    return matchesSearch && matchesStatus && matchesTable && matchesStartDate && matchesEndDate && matchesTimeFilter;
  }).sort((a, b) => {
    // Local sorting
    let aValue, bValue;
    
    switch (sortBy) {
      case 'orderNumber':
        aValue = a.orderNumber.toLowerCase();
        bValue = b.orderNumber.toLowerCase();
        break;
      case 'total':
        aValue = parseFloat(a.total);
        bValue = parseFloat(b.total);
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      default:
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Apply pagination to filtered results
  const paginatedOrders = filteredOrders.slice(
    (pagination.page - 1) * pagination.limit,
    pagination.page * pagination.limit
  );

  // Calculate pagination metadata directly
  const paginationMetadata = {
    total: filteredOrders.length,
    pages: Math.ceil(filteredOrders.length / pagination.limit)
  };

  // Handle search term changes
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Get current time filter display text
  const getTimeFilterDisplay = () => {
    switch (timeFilter) {
      case 'today':
        return 'Today';
      case 'thisWeek':
        return 'This Week';
      case 'thisMonth':
        return 'This Month';
      case 'thisYear':
        return 'This Year';
      default:
        return 'All Time';
    }
  };

  // Get current time filter description for filters panel
  const getTimeFilterDescription = () => {
    const today = new Date();
    switch (timeFilter) {
      case 'today':
        return `Showing orders for today (${today.toLocaleDateString()})`;
      case 'thisWeek':
        return `Showing orders for this week (${today.toLocaleDateString()})`;
      case 'thisMonth':
        return `Showing orders for this month (${today.toLocaleDateString()})`;
      case 'thisYear':
        return `Showing orders for this year (${today.toLocaleDateString()})`;
      default:
        return 'Showing all orders';
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // WebSocket subscription for real-time order updates
  useEffect(() => {
    const unsubscribe = websocketService.subscribe('message', (data) => {
      if (data.type === 'order_created' || data.type === 'order_updated' || data.type === 'order_deleted') {
        // Refresh orders list when orders are modified
        fetchOrders();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);


  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Fetch all orders without pagination for client-side filtering
      const response = await axios.get('/api/orders?limit=1000');
      setAllOrders(response.data.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error(error.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };


  // Helper to show confirmation modal and return a promise
  const showConfirm = ({ title, message, confirmText, cancelText, icon, type = 'warning' }) => {
    return new Promise((resolve) => {
      setConfirmDialog({
        open: true,
        title,
        message,
        confirmText,
        cancelText,
        icon,
        type,
        onConfirm: () => {
          setConfirmDialog({ open: false });
          resolve(true);
        },
        onCancel: () => {
          setConfirmDialog({ open: false });
          resolve(false);
        }
      });
    });
  };

  const handlePayment = (order) => {
    setSelectedOrder(order);
    setShowPaymentPage(true);
  };

  const handlePaymentSuccess = async () => {
    await fetchOrders(); // Refresh orders
    setShowPaymentPage(false);
    setSelectedOrder(null);
  };

  const handleCancelOrder = async (orderId) => {
    const confirmed = await showConfirm({
      title: 'Cancel Order',
      message: 'Are you sure you want to cancel this order? This action cannot be undone.',
      confirmText: 'Yes, Cancel',
      cancelText: 'No',
      type: 'danger'
    });
    if (!confirmed) return;
    setActionLoading(true);
    try {
      await axios.patch(`/api/orders/${orderId}/cancel`);
      toast.success('Order cancelled successfully!');
      fetchOrders();
      setSelectedOrder(null); // Close modal after cancel
    } catch (error) {
      console.error('Cancel failed:', error);
      if (error.response?.data?.errors) {
        toast.error(error.response.data.errors.map(e => e.msg).join(', '));
      } else {
        toast.error(error.response?.data?.message || 'Cancel failed');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkCancel = async () => {
    const confirmed = await showConfirm({
      title: 'Cancel Multiple Orders',
      message: `Are you sure you want to cancel ${selectedOrders.length} selected orders? This action cannot be undone.`,
      confirmText: 'Yes, Cancel All',
      cancelText: 'No',
      type: 'danger'
    });
    if (!confirmed) return;
    setActionLoading(true);
    try {
      await Promise.all(selectedOrders.map(orderId => axios.patch(`/api/orders/${orderId}/cancel`)));
      toast.success(`${selectedOrders.length} orders cancelled successfully!`);
      setSelectedOrders([]);
      fetchOrders();
    } catch (error) {
      console.error('Bulk cancel failed:', error);
      toast.error('Failed to cancel some orders');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOrderCreated = (newOrder) => {
    setShowCreateModal(false);
    toast.success('Order created successfully!');
    fetchOrders();
  };

  const handleOrderUpdated = () => {
    setShowEditModal(false);
    setSelectedOrder(null);
    toast.success('Order updated successfully!');
    fetchOrders();
  };

  const handleEditOrder = (order) => {
    setSelectedOrder(order);
    setShowEditModal(true);
  };

  const handlePrintInvoice = (order) => {
    setSelectedOrder(order);
    setShowInvoiceModal(true);
  };


  const handleSelectAll = () => {
    if (selectedOrders.length === paginatedOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(paginatedOrders.map(order => order.id));
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { class: 'order-status-pending', icon: 'clock' },
      COMPLETED: { class: 'order-status-completed', icon: 'check' },
      CANCELLED: { class: 'order-status-cancelled', icon: 'close' }
    };
    
    const config = statusConfig[status] || { class: 'order-status-pending', icon: 'warning' };
    
    return (
      <span className={`order-status ${config.class} flex items-center gap-2`}>
        <Icon name={config.icon} size="sm" />
        <span>{status}</span>
      </span>
    );
  };

  const getPaymentMethodBadge = (method) => {
    if (!method) return null;
    return (
      <span className="px-3 py-1.5 text-sm font-semibold rounded-full bg-green-100 text-green-800 border border-green-200 whitespace-nowrap">
        {method}
      </span>
    );
  };

  // Helper: format date
  function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  // Helper: format currency
  function formatCurrency(amount) {
    if (typeof amount !== 'number') amount = Number(amount) || 0;
    return '$' + amount.toLocaleString(undefined, { minimumFractionDigits: 2 });
  }

  if (loading) {
    return <OrdersSkeleton rows={isMobile ? 4 : 8} />;
  }

  return (
    <div className="space-y-2 relative">
      {actionLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-2xl">
          <div className="text-center">
            <div className="loading-spinner mx-auto"></div>
            <p className="mt-4 text-sm font-medium text-neutral-600 animate-pulse-gentle">Processing...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="card-gradient p-4 sm:p-6 animate-slide-down sticky top-0 z-30 bg-white shadow">
        {/* Status Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Total Orders */}
          <div className="p-6 rounded-xl shadow-lg text-white" style={{background: 'linear-gradient(to right, #53B312, #4A9F0F)'}}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Orders</p>
                <p className="text-3xl font-bold">{paginatedOrders.length}</p>
              </div>
              <div className="text-4xl">📋</div>
            </div>
          </div>
          
          {/* Pending Orders */}
          <button 
            onClick={() => {
              setSelectedStatus(selectedStatus === 'PENDING' ? '' : 'PENDING');
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className={`p-6 rounded-xl shadow-lg text-white hover:shadow-xl transition-all duration-200 hover:scale-105 focus:ring-4 focus:outline-none ${
              selectedStatus === 'PENDING' 
                ? 'ring-4 ring-orange-300 scale-105 bg-gradient-to-r from-orange-500 to-orange-600' 
                : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
            }`}
            title={selectedStatus === 'PENDING' ? 'Click to show all orders' : 'Click to filter and show only Pending orders'}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Pending</p>
                <p className="text-3xl font-bold">{paginatedOrders.filter(order => order.status === 'PENDING').length}</p>
              </div>
              <div className="text-4xl">⏰</div>
            </div>
          </button>
          
          {/* Completed Orders */}
          <button 
            onClick={() => {
              setSelectedStatus(selectedStatus === 'COMPLETED' ? '' : 'COMPLETED');
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className={`p-6 rounded-xl shadow-lg text-white hover:shadow-xl transition-all duration-200 hover:scale-105 focus:ring-4 focus:outline-none ${
              selectedStatus === 'COMPLETED' 
                ? 'ring-4 ring-green-300 scale-105 bg-gradient-to-r from-green-500 to-green-600' 
                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
            }`}
            title={selectedStatus === 'COMPLETED' ? 'Click to show all orders' : 'Click to filter and show only Completed orders'}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Completed</p>
                <p className="text-3xl font-bold">{paginatedOrders.filter(order => order.status === 'COMPLETED').length}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </button>
          
          {/* Cancelled Orders */}
          <button 
            onClick={() => {
              setSelectedStatus(selectedStatus === 'CANCELLED' ? '' : 'CANCELLED');
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className={`p-6 rounded-xl shadow-lg text-white hover:shadow-xl transition-all duration-200 hover:scale-105 focus:ring-4 focus:outline-none ${
              selectedStatus === 'CANCELLED' 
                ? 'ring-4 ring-red-300 scale-105 bg-gradient-to-r from-red-500 to-red-600' 
                : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
            }`}
            title={selectedStatus === 'CANCELLED' ? 'Click to show all orders' : 'Click to filter and show only Cancelled orders'}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Cancelled</p>
                <p className="text-3xl font-bold">{paginatedOrders.filter(order => order.status === 'CANCELLED').length}</p>
              </div>
              <div className="text-4xl">❌</div>
            </div>
          </button>
        </div>
        
        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row justify-end items-center gap-3 sm:gap-6 w-full">
          {/* Time Filter Dropdown */}
          <div className="flex items-center gap-2">
            <select
              id="timeFilter"
              value={timeFilter}
              onChange={(e) => {
                setTimeFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white hover:border-gray-400"
            >
              <option value="">All</option>
              <option value="today">Today</option>
              <option value="thisWeek">This Week</option>
              <option value="thisMonth">This Month</option>
              <option value="thisYear">This Year</option>
            </select>
          </div>
          
          <button
            className="btn-secondary flex items-center"
            onClick={() => setShowFilters(v => !v)}
          >
            <Icon name="filter" className="mr-2" /> Filters
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Icon name="add" size="sm" />
            <span>Create New Order</span>
          </button>
          
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div>
          <OrderFilters
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            selectedTable={selectedTable}
            onTableChange={setSelectedTable}
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
            showTodayOnly={showTodayOnly}
            onReset={() => {
              setSearchTerm('');
              setSelectedStatus('');
              setSelectedTable('');
              setStartDate('');
              setEndDate('');
              setTimeFilter('');
              setPagination(prev => ({ ...prev, page: 1 }));
              setShowFilters(false); // auto-close on reset
            }}
            className="flex-1"
            resetButtonClassName="btn-danger ml-auto"
            onApply={() => setShowFilters(false)} // auto-close on apply (if you add an Apply button)
          />
        </div>
      )}

      {/* Orders List */}
      <div className="table-container">
        <div className="table-header flex justify-between items-center pb-2">
          <div>
            <h3 className="text-xl font-bold text-gradient flex items-center">
              Orders ({paginationMetadata.total})
              {timeFilter && (
                <span className="ml-3 text-sm bg-gradient-to-r from-primary-100 to-primary-200 text-primary-800 px-3 py-1 rounded-full border border-primary-300 shadow-soft flex items-center">
                  <Icon name="calendar" size="sm" className="mr-1" />
                  {getTimeFilterDisplay()}
                </span>
              )}
            </h3>
            <p className="text-sm text-neutral-600 mt-1">
              Click on any order to view details and perform actions
            </p>
          </div>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedOrders.length === paginatedOrders.length && paginatedOrders.length > 0}
              onChange={handleSelectAll}
              className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500 focus:ring-2"
              aria-label="Select all orders"
            />
            <span className="text-sm font-medium text-neutral-700">Select All</span>
          </label>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <div className="space-y-3">
            {paginatedOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="icon-container bg-primary text-white mb-4">
                  <Icon name="orders" size="xl" />
                </div>
                <div className="text-xl font-bold text-primary mb-2">No orders found</div>
                <div className="text-gray-500 mb-4">Create your first order to get started!</div>
                <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                  <Icon name="add" className="mr-2" /> New Order
                </button>
              </div>
            ) : (
              paginatedOrders.map((order, index) => (
                <div
                  key={order.id}
                  className="bg-neutral-50 rounded-2xl shadow p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between hover:shadow-lg transition group cursor-pointer border border-transparent hover:border-primary-200"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => setSelectedOrder(order)}
                  tabIndex={0}
                  aria-label={`View details for order ${order.orderNumber}`}
                >
                  <div className="flex-1 flex flex-col md:flex-row md:items-center md:space-x-6">
                    <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
                      <div className="flex items-center space-x-2 mb-1 md:mb-0">
                        <span className="text-lg font-bold text-primary">#{order.orderNumber}</span>
                        {/* Status and Payment Badges */}
                        <span className="flex items-center space-x-2">
                          {order.status === 'COMPLETED' && (
                            <span className="flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                              <Icon name="check" size="sm" className="mr-1" /> COMPLETED
                            </span>
                          )}
                          {order.status === 'CANCELLED' && (
                            <span className="flex items-center px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                              <Icon name="close" size="sm" className="mr-1" /> CANCELLED
                            </span>
                          )}
                          {order.status === 'PENDING' && (
                            <span className="flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">
                              <Icon name="clock" size="sm" className="mr-1" /> PENDING
                            </span>
                          )}
                          {order.paymentMethod && (
                            <span className="flex items-center px-3 py-1 rounded-full bg-neutral-200 text-neutral-700 text-xs font-semibold ml-1">
                              <Icon name="creditCard" size="sm" className="mr-1" /> {order.paymentMethod}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 md:ml-0 mt-1 md:mt-0">Table {order.table?.number || 'N/A'} • {order.orderItems?.length || 0} items</div>
                      <div className="text-xs text-gray-400 md:ml-0 mt-1 md:mt-0">{formatDate(order.createdAt)}</div>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mt-3 md:mt-0 items-end">
                    <div className="font-bold text-lg text-gradient mb-2 md:mb-0">{formatCurrency(order.total)}</div>
                    <div className="flex space-x-2">
                      {order.status === 'PENDING' && (
                        <button
                          className="btn-secondary flex items-center px-4 py-2 rounded-lg text-sm font-semibold shadow-sm"
                          onClick={e => { e.stopPropagation(); handleEditOrder(order); }}
                          aria-label={`Edit order ${order.orderNumber}`}
                        >
                          <Icon name="edit" className="mr-2" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                      )}
                      <button
                        className="btn-accent flex items-center px-4 py-2 rounded-lg text-sm font-semibold shadow-sm"
                        onClick={e => { e.stopPropagation(); handlePrintInvoice(order); }}
                        aria-label={`Download invoice for order ${order.orderNumber}`}
                      >
                        <Icon name="download" className="mr-2" />
                        <span className="hidden sm:inline">Invoice</span>
                      </button>
                      
                      {order.status === 'PENDING' ? (
                        <button
                          className="btn-success flex items-center px-4 py-2 rounded-lg text-sm font-semibold shadow-sm"
                          onClick={e => { 
                            e.stopPropagation(); 
                            handlePayment(order);
                          }}
                          aria-label={`Pay for order ${order.orderNumber}`}
                        >
                          <Icon name="creditCard" className="mr-2" />
                          <span className="hidden sm:inline">Pay</span>
                        </button>
                      ) : (
                        <button
                          className="btn-secondary flex items-center px-4 py-2 rounded-lg text-sm font-semibold shadow-sm"
                          onClick={e => { 
                            e.stopPropagation(); 
                            
                            // Check if this is a split payment
                            if (order.splitBill && order.splitAmounts) {
                              // For split payments, show SplitReceiptManager
                              setSelectedOrder(order);
                              setShowSplitReceiptManager(true);
                            } else {
                              // For full payments, directly show the receipt
                              setSelectedOrder(order);
                              setShowDraftReceipt(true);
                            }
                          }}
                          aria-label={`Print receipt for order ${order.orderNumber}`}
                        >
                          <Icon name="receipt" className="mr-2" />
                          <span className="hidden sm:inline">Receipt</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pagination */}
        {paginationMetadata.pages > 1 && (
          <div className="table-header">
            <div className="flex justify-between items-center">
              <div className="text-sm text-neutral-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, paginationMetadata.total)} of{' '}
                {paginationMetadata.total} results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="pagination-btn-inactive disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  <Icon name="chevronLeft" size="sm" />
                  <span>Previous</span>
                </button>
                <span className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg">
                  Page {pagination.page} of {paginationMetadata.pages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === paginationMetadata.pages}
                  className="pagination-btn-inactive disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  <span>Next</span>
                  <Icon name="chevronRight" size="sm" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && !showEditModal && !showInvoiceModal && (
        <div className="modal-backdrop">
          <div className="modal-content max-w-4xl">
            <div className="p-8">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center space-x-4">
                  <div className="icon-primary">
                    <Icon name="orders" color="#0ea5e9" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gradient">
                      Order #{selectedOrder.orderNumber}
                    </h3>
                    <div className="mt-2">
                      {getStatusBadge(selectedOrder.status)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="icon-container bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors duration-200"
                >
                  <Icon name="close" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Order Information - Clean Design */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <h4 className="text-lg font-semibold text-gray-900 mb-6">Order Information</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Table */}
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Icon name="tables" className="text-blue-600" size="sm" />
                      </div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Table</p>
                      <p className="text-lg font-semibold text-gray-900">Table {selectedOrder.table?.number || 'N/A'}</p>
                    </div>
                    
                    {/* Cashier */}
                    <div className="text-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Icon name="profile" className="text-purple-600" size="sm" />
                      </div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Cashier</p>
                      <p className="text-lg font-semibold text-gray-900">{selectedOrder.user?.name || 'N/A'}</p>
                    </div>
                    
                    {/* Date & Time */}
                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Icon name="calendar" className="text-green-600" size="sm" />
                      </div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Date & Time</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(selectedOrder.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(selectedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    
                    {/* Payment Method */}
                    {selectedOrder.paymentMethod && (
                      <div className="text-center">
                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                          <Icon name="creditCard" className="text-orange-600" size="sm" />
                        </div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Payment</p>
                        <div className="mt-1">
                          {getPaymentMethodBadge(selectedOrder.paymentMethod)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Unified Order Summary with Items */}
                <div className="card-gradient p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="icon-container bg-gradient-to-br from-success-100 to-success-200 text-success-700">
                      <Icon name="money" />
                    </div>
                    <h4 className="text-xl font-bold text-gradient">Order Summary</h4>
                  </div>
                  
                  {/* Order Items */}
                  <div className="mb-6">
                    <div className="space-y-3">
                      {selectedOrder.orderItems?.map((item, index) => (
                        <div key={item.id} className="flex justify-between items-center p-3 bg-white/50 rounded-xl border border-white/30">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-medium text-neutral-500">#{index + 1}</span>
                            <span className="font-medium text-neutral-900">{item.product?.name || 'Unknown Product'}</span>
                            <span className="text-sm text-neutral-500">x{item.quantity}</span>
                          </div>
                          <span className="font-bold text-gradient">${parseFloat(item.subtotal).toFixed(2)}</span>
                        </div>
                      )) || <p className="text-neutral-500 text-center py-4">No items found</p>}
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl">
                      <span className="font-medium text-neutral-700">Subtotal:</span>
                      <span className="font-bold text-neutral-900">${parseFloat(selectedOrder.subtotal).toFixed(2)}</span>
                    </div>
                    {selectedOrder.discount > 0 && (
                      <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl">
                        <span className="font-medium text-neutral-700">Discount ({Math.round((parseFloat(selectedOrder.discount) / (selectedOrder.orderItems.reduce((sum, item) => sum + parseFloat(item.subtotal), 0))) * 100)}%):</span>
                        <span className="font-bold text-danger-600">-${parseFloat(selectedOrder.discount).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl">
                      <span className="font-medium text-neutral-700">VAT ({getOrderVATRate(selectedOrder)}%):</span>
                      <span className="font-bold text-neutral-900">
                        ${(parseFloat(selectedOrder.total) - parseFloat(selectedOrder.subtotal) + parseFloat(selectedOrder.discount || 0)).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl border border-primary-200">
                      <span className="text-lg font-bold text-neutral-900">Total:</span>
                      <span className="text-2xl font-bold text-gradient">${parseFloat(selectedOrder.total).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Customer Note */}
                {selectedOrder.customerNote && (
                  <div className="card-gradient p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="icon-container bg-gradient-to-br from-accent-100 to-accent-200 text-accent-700">
                        <Icon name="info" />
                      </div>
                      <h4 className="font-semibold text-neutral-900">Customer Note</h4>
                    </div>
                    <p className="text-neutral-700 bg-white/50 p-4 rounded-xl border border-white/30">
                      {selectedOrder.customerNote}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="card-gradient p-6">
                  <div className="flex flex-wrap gap-3">
                    {selectedOrder.status === 'PENDING' && (
                      <button
                        onClick={() => handleEditOrder(selectedOrder)}
                        className="btn-warning flex items-center space-x-2"
                      >
                        <Icon name="edit" size="sm" />
                        <span>Edit Order</span>
                      </button>
                    )}
                    {selectedOrder.status === 'PENDING' && (
                      <button
                        onClick={() => handlePayment(selectedOrder)}
                        className="btn-success flex items-center space-x-2"
                      >
                        <Icon name="creditCard" size="sm" />
                        <span>Pay</span>
                      </button>
                    )}
                    {selectedOrder.status === 'COMPLETED' && (
                      <>
                        <button
                          onClick={() => handlePrintInvoice(selectedOrder)}
                          className="btn-primary flex items-center space-x-2"
                        >
                          <Icon name="download" size="sm" />
                          <span>Print Invoice</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            // Check if this is a split payment
                            if (selectedOrder.splitBill && selectedOrder.splitAmounts) {
                              // For split payments, show SplitReceiptManager
                              setShowSplitReceiptManager(true);
                            } else {
                              // For full payments, directly show the receipt
                              setShowDraftReceipt(true);
                            }
                          }}
                          className="btn-secondary flex items-center space-x-2"
                        >
                          <Icon name="receipt" size="sm" />
                          <span>Receipt</span>
                        </button>
                      </>
                    )}
                    {selectedOrder.status === 'PENDING' && (
                      <button
                        onClick={() => handleCancelOrder(selectedOrder.id)}
                        className="btn-danger flex items-center space-x-2"
                      >
                        <Icon name="close" size="sm" />
                        <span>Cancel Order</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {showCreateModal && (
        <CreateOrder
          onClose={() => setShowCreateModal(false)}
          onOrderCreated={handleOrderCreated}
        />
      )}

      {/* Edit Order Modal */}
      {showEditModal && selectedOrder && (
        <EditOrder
          order={selectedOrder}
          onClose={() => {
            setShowEditModal(false);
            setSelectedOrder(null);
          }}
          onOrderUpdated={handleOrderUpdated}
        />
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && selectedOrder && (
        <InvoiceModal
          order={selectedOrder}
          onClose={() => {
            setShowInvoiceModal(false);
            setSelectedOrder(null);
          }}
        />
      )}

      {/* Payment Page */}
      {showPaymentPage && selectedOrder && (
        <PaymentPage
          order={selectedOrder}
          onClose={() => {
            setShowPaymentPage(false);
            setSelectedOrder(null);
          }}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Split Receipt Manager Modal */}
      {showSplitReceiptManager && selectedOrder && (
        <SplitReceiptManager
          order={selectedOrder}
          receiptType="final"
          onClose={() => {
            setShowSplitReceiptManager(false);
            setSelectedOrder(null);
          }}
        />
      )}

      {/* Simple Receipt Modal */}
      {showSimpleReceipt && selectedOrder && (
        <SimpleReceiptModal
          order={selectedOrder}
          onClose={() => {
            setShowSimpleReceipt(false);
            setSelectedOrder(null);
          }}
        />
      )}

      {/* Receipt Modal */}
      {showDraftReceipt && selectedOrder && (
        <SimpleReceiptModal
          order={selectedOrder}
          receiptType={selectedOrder.status === 'PENDING' ? 'draft' : 'final'}
          onClose={() => {
            setShowDraftReceipt(false);
            setSelectedOrder(null);
          }}
        />
      )}

      {/* Confirm Dialog */}
      {confirmDialog.open && (
        <ConfirmDialog {...confirmDialog} />
      )}

      {/* 2. Sticky action bar for mobile */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-surface flex justify-between px-4 py-3 shadow-lg space-x-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex-1 flex items-center justify-center"
          >
            <Icon name="add" size="sm" className="mr-2" /> New Order
          </button>
          {selectedOrders.length > 0 && (
            <button
              onClick={handleBulkCancel}
              className="btn-danger flex-1 flex items-center justify-center"
            >
              <Icon name="delete" size="sm" className="mr-2" /> Cancel ({selectedOrders.length})
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Orders; 