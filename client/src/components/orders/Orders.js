import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';
import CreateOrder from './CreateOrder';
import EditOrder from './EditOrder';
import OrderFilters from './OrderFilters';
import InvoiceModal from './InvoiceModal';
import debounce from 'lodash.debounce';
import ConfirmDialog from '../common/ConfirmDialog';
import websocketService from '../../services/websocket';
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
  // Helper function to get today's date in YYYY-MM-DD format (UTC)
  const getTodayDate = () => {
    const today = new Date();
    // Use UTC to avoid timezone issues
    const year = today.getUTCFullYear();
    const month = String(today.getUTCMonth() + 1).padStart(2, '0');
    const day = String(today.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showTodayOnly, setShowTodayOnly] = useState(true); // New state for toggle
  const [filters, setFilters] = useState({
    status: '',
    tableId: '',
    startDate: '', // Don't filter by date by default
    endDate: '',   // Don't filter by date by default
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [confirmDialog, setConfirmDialog] = useState({ open: false });
  const [isMobile, setIsMobile] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState('all');

  // Helper to get date range for filter (UTC)
  const getDateRange = (range) => {
    const today = new Date();
    let startDate = '', endDate = '';
    if (range === 'today') {
      startDate = endDate = getTodayDate();
    } else if (range === 'week') {
      // Get the start of the week (Sunday) in UTC
      const dayOfWeek = today.getUTCDay();
      const startOfWeek = new Date(today);
      startOfWeek.setUTCDate(today.getUTCDate() - dayOfWeek);
      
      // Get the end of the week (Saturday) in UTC
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6);
      
      startDate = startOfWeek.toISOString().slice(0, 10);
      endDate = endOfWeek.toISOString().slice(0, 10);
    } else if (range === 'month') {
      const y = today.getUTCFullYear();
      const m = today.getUTCMonth();
      const startOfMonth = new Date(Date.UTC(y, m, 1));
      const endOfMonth = new Date(Date.UTC(y, m + 1, 0));
      startDate = startOfMonth.toISOString().slice(0, 10);
      endDate = endOfMonth.toISOString().slice(0, 10);
    } else if (range === 'all') {
      startDate = '';
      endDate = '';
    } else {
      startDate = '';
      endDate = '';
    }
    return { startDate, endDate };
  };

  // Update filters when dateRange changes
  useEffect(() => {
    const { startDate, endDate } = getDateRange(dateRange);
    setFilters(prev => ({ ...prev, startDate, endDate }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [dateRange]);

  useEffect(() => {
    fetchOrders();
  }, [filters, pagination.page]);

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

  // Function to toggle between today's orders and all orders
  const toggleTodayOnly = () => {
    setShowTodayOnly(!showTodayOnly);
    if (!showTodayOnly) {
      // Switch to today's orders
      const todayDate = getTodayDate();
      setFilters(prev => ({
        ...prev,
        startDate: todayDate,
        endDate: todayDate
      }));
    } else {
      // Switch to all orders
      setFilters(prev => ({
        ...prev,
        startDate: '',
        endDate: ''
      }));
    }
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      const response = await axios.get(`/api/orders?${params}`);
      setOrders(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error(error.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Helper to fetch and update selectedOrder
  const fetchAndSetSelectedOrder = async (orderId) => {
    try {
      const response = await axios.get(`/api/orders/${orderId}`);
      setSelectedOrder(response.data.data);
    } catch (error) {
      toast.error('Failed to refresh order details');
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

  const handlePayment = async (orderId) => {
    const confirmed = await showConfirm({
      title: 'Confirm Payment',
      message: 'Are you sure you want to process payment for this order?',
      confirmText: 'Yes, Pay',
      cancelText: 'No',
      type: 'success'
    });
    if (!confirmed) return;
    setActionLoading(true);
    try {
      await axios.patch(`/api/orders/${orderId}/pay`, { paymentMethod: 'CARD' });
      toast.success('Payment processed successfully!');
      fetchOrders();
      setSelectedOrder(null); // Close modal after payment
    } catch (error) {
      console.error('Payment failed:', error);
      if (error.response?.data?.errors) {
        toast.error(error.response.data.errors.map(e => e.msg).join(', '));
      } else {
        toast.error(error.response?.data?.message || 'Payment failed');
      }
    } finally {
      setActionLoading(false);
    }
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

  const handleSelectOrder = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(order => order.id));
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
      <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r from-primary-100 to-primary-200 text-primary-800 border border-primary-300 shadow-soft">
        <Icon name="creditCard" size="xs" className="mr-1" />
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
  // Action button component
  const ActionButton = ({ icon, label, onClick, color = 'primary' }) => (
    <button
      className={`btn-${color} btn-sm flex items-center space-x-1 px-3 py-2 rounded-lg font-medium transition hover:scale-105`}
      onClick={onClick}
      title={label}
      aria-label={label}
      type="button"
    >
      <Icon name={icon} size="sm" />
      <span className="hidden md:inline">{label}</span>
    </button>
  );

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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Pending */}
          <div className="flex items-center bg-white rounded-2xl shadow-md px-4 sm:px-6 py-4 sm:py-5">
            <span className="flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-orange-200 mr-3 sm:mr-6">
              <Icon name="clock" className="text-orange-600" size="lg" />
            </span>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-gray-900">{orders.filter(order => order.status === 'PENDING').length}</div>
              <div className="text-sm sm:text-base text-gray-500 mt-1">Pending Orders</div>
            </div>
          </div>
          {/* Completed */}
          <div className="flex items-center bg-white rounded-2xl shadow-md px-4 sm:px-6 py-4 sm:py-5">
            <span className="flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-green-200 mr-3 sm:mr-6">
              <Icon name="check" className="text-green-600" size="lg" />
            </span>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-gray-900">{orders.filter(order => order.status === 'COMPLETED').length}</div>
              <div className="text-sm sm:text-base text-gray-500 mt-1">Completed Orders</div>
            </div>
          </div>
          {/* Cancelled */}
          <div className="flex items-center bg-white rounded-2xl shadow-md px-4 sm:px-6 py-4 sm:py-5">
            <span className="flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-red-200 mr-3 sm:mr-6">
              <Icon name="error" className="text-red-600" size="lg" />
            </span>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-gray-900">{orders.filter(order => order.status === 'CANCELLED').length}</div>
              <div className="text-sm sm:text-base text-gray-500 mt-1">Cancelled Orders</div>
            </div>
          </div>
        </div>
        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row justify-end items-center gap-3 sm:gap-6 w-full">
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            className="px-6 py-3 rounded-xl text-sm font-semibold border border-primary-300 bg-white text-primary-800 shadow-soft focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all duration-200"
            style={{ minWidth: 140 }}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All</option>
          </select>
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
            filters={filters}
            onFiltersChange={setFilters}
            showTodayOnly={showTodayOnly}
            onReset={() => {
              setFilters({
                status: '',
                tableId: '',
                startDate: showTodayOnly ? getTodayDate() : '',
                endDate: showTodayOnly ? getTodayDate() : '',
                search: ''
              });
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
              Orders ({pagination.total})
              {showTodayOnly && (
                <span className="ml-3 text-sm bg-gradient-to-r from-primary-100 to-primary-200 text-primary-800 px-3 py-1 rounded-full border border-primary-300 shadow-soft flex items-center">
                  <Icon name="calendar" size="sm" className="mr-1" />
                  Today
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
              checked={selectedOrders.length === orders.length && orders.length > 0}
              onChange={handleSelectAll}
              className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500 focus:ring-2"
              aria-label="Select all orders"
            />
            <span className="text-sm font-medium text-neutral-700">Select All</span>
          </label>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <div className="space-y-3">
            {orders.length === 0 ? (
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
              orders.map((order, index) => (
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
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="table-header">
            <div className="flex justify-between items-center">
              <div className="text-sm text-neutral-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
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
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
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
                    <h3 className="text-3xl font-bold text-gradient">
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
                {/* Order Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="card-gradient p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="icon-container bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700">
                        <Icon name="tables" />
                      </div>
                      <h4 className="font-semibold text-neutral-900">Table Information</h4>
                    </div>
                    <p className="text-lg font-bold text-gradient">Table {selectedOrder.table?.number || 'N/A'}</p>
                  </div>
                  <div className="card-gradient p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="icon-container bg-gradient-to-br from-accent-100 to-accent-200 text-accent-700">
                        <Icon name="profile" />
                      </div>
                      <h4 className="font-semibold text-neutral-900">Cashier</h4>
                    </div>
                    <p className="text-lg font-bold text-gradient">{selectedOrder.user?.name || 'N/A'}</p>
                  </div>
                  <div className="card-gradient p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="icon-container bg-gradient-to-br from-success-100 to-success-200 text-success-700">
                        <Icon name="calendar" />
                      </div>
                      <h4 className="font-semibold text-neutral-900">Date & Time</h4>
                    </div>
                    <p className="text-lg font-bold text-gradient">
                      {new Date(selectedOrder.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {selectedOrder.paymentMethod && (
                    <div className="card-gradient p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="icon-container bg-gradient-to-br from-warning-100 to-warning-200 text-warning-700">
                          <Icon name="creditCard" />
                        </div>
                        <h4 className="font-semibold text-neutral-900">Payment Method</h4>
                      </div>
                      {getPaymentMethodBadge(selectedOrder.paymentMethod)}
                    </div>
                  )}
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
                        <span className="font-medium text-neutral-700">Discount:</span>
                        <span className="font-bold text-danger-600">-${parseFloat(selectedOrder.discount).toFixed(2)}</span>
                      </div>
                    )}
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
                        onClick={() => handlePayment(selectedOrder.id)}
                        className="btn-success flex items-center space-x-2"
                      >
                        <Icon name="creditCard" size="sm" />
                        <span>Process Payment</span>
                      </button>
                    )}
                    {selectedOrder.status === 'COMPLETED' && (
                      <button
                        onClick={() => handlePrintInvoice(selectedOrder)}
                        className="btn-primary flex items-center space-x-2"
                      >
                        <Icon name="download" size="sm" />
                        <span>Print Invoice</span>
                      </button>
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