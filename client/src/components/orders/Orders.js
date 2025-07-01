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

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    tableId: '',
    startDate: '',
    endDate: '',
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

  // Debounced filter for search
  const debouncedSetFilters = debounce((newFilters) => {
    setFilters(newFilters);
  }, 400);

  useEffect(() => {
    fetchOrders();
  }, [filters, pagination.page]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
  const showConfirm = ({ title, message, confirmText, cancelText, icon }) => {
    return new Promise((resolve) => {
      setConfirmDialog({
        open: true,
        title,
        message,
        confirmText,
        cancelText,
        icon,
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

  const handlePayment = async (orderId, paymentMethod) => {
    const confirmed = await showConfirm({
      title: 'Confirm Payment',
      message: `Are you sure you want to pay this order by ${paymentMethod}?`,
      confirmText: `Yes, Pay by ${paymentMethod}`,
      cancelText: 'No',
      icon: paymentMethod === 'CASH' ? '💰' : '💳'
    });
    if (!confirmed) return;
    setActionLoading(true);
    try {
      await axios.patch(`/api/orders/${orderId}/pay`, { paymentMethod });
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
      icon: '❌'
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
        toast.error(error.response?.data?.message || 'Failed to cancel order');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrepareOrder = async (orderId) => {
    const confirmed = await showConfirm({
      title: 'Mark as Preparing',
      message: 'Mark this order as PREPARING?',
      confirmText: 'Yes, Mark as Preparing',
      cancelText: 'No',
      icon: '👨‍🍳'
    });
    if (!confirmed) return;
    setActionLoading(true);
    try {
      await axios.patch(`/api/orders/${orderId}/prepare`);
      toast.success('Order marked as preparing!');
      fetchOrders();
      await fetchAndSetSelectedOrder(orderId); // Refresh modal
    } catch (error) {
      console.error('Prepare failed:', error);
      if (error.response?.data?.errors) {
        toast.error(error.response.data.errors.map(e => e.msg).join(', '));
      } else {
        toast.error(error.response?.data?.message || 'Failed to mark order as preparing');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleReadyOrder = async (orderId) => {
    const confirmed = await showConfirm({
      title: 'Mark as Ready',
      message: 'Mark this order as READY?',
      confirmText: 'Yes, Mark as Ready',
      cancelText: 'No',
      icon: '🍽️'
    });
    if (!confirmed) return;
    setActionLoading(true);
    try {
      await axios.patch(`/api/orders/${orderId}/ready`);
      toast.success('Order marked as ready!');
      fetchOrders();
      await fetchAndSetSelectedOrder(orderId); // Refresh modal
    } catch (error) {
      console.error('Ready failed:', error);
      if (error.response?.data?.errors) {
        toast.error(error.response.data.errors.map(e => e.msg).join(', '));
      } else {
        toast.error(error.response?.data?.message || 'Failed to mark order as ready');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkCancel = async () => {
    if (selectedOrders.length === 0) {
      toast.warning('Please select orders to cancel');
      return;
    }

    // Find the actual order objects for status check
    const cancellableOrders = orders.filter(order =>
      selectedOrders.includes(order.id) &&
      order.status !== 'COMPLETED' &&
      order.status !== 'CANCELLED'
    );

    if (cancellableOrders.length === 0) {
      toast.warning('No selected orders can be cancelled');
      return;
    }

    const confirmed = await showConfirm({
      title: 'Bulk Cancel Orders',
      message: `Are you sure you want to cancel ${cancellableOrders.length} orders? This action cannot be undone.`,
      confirmText: `Yes, Cancel ${cancellableOrders.length}`,
      cancelText: 'No',
      icon: '❌'
    });
    if (!confirmed) return;

    setActionLoading(true);
    try {
      await Promise.all(
        cancellableOrders.map(order =>
          axios.patch(`/api/orders/${order.id}/cancel`)
        )
      );
      toast.success(`${cancellableOrders.length} orders cancelled successfully!`);
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
    setOrders([newOrder, ...orders]);
  };

  const handleOrderUpdated = () => {
    fetchOrders();
    setShowEditModal(false);
    setSelectedOrder(null);
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
      PENDING: { class: 'order-status-pending', icon: '⏳' },
      COMPLETED: { class: 'order-status-completed', icon: '✅' },
      CANCELLED: { class: 'order-status-cancelled', icon: '❌' },
      PREPARING: { class: 'order-status-preparing', icon: '👨‍🍳' },
      READY: { class: 'order-status-ready', icon: '🍽️' }
    };
    
    const config = statusConfig[status] || { class: 'order-status-pending', icon: '❓' };
    
    return (
      <span className={`order-status ${config.class} flex items-center gap-1`}>
        <span>{config.icon}</span>
        <span>{status}</span>
      </span>
    );
  };

  const getPaymentMethodBadge = (method) => {
    if (!method) return null;
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
        {method}
      </span>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6 relative">
      {actionLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Processing...</p>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage orders, payments, and customer service
          </p>
        </div>
        <div className="flex space-x-3">
          {selectedOrders.length > 0 && (
            <button
              onClick={handleBulkCancel}
              className="btn-danger"
            >
              Cancel Selected ({selectedOrders.length})
            </button>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            Create New Order
          </button>
        </div>
      </div>

      {/* Order Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-warning-100 rounded-lg">
              <span className="text-warning-600 text-xl">⏳</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-lg font-semibold text-gray-900">
                {orders.filter(order => order.status === 'PENDING').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-blue-600 text-xl">👨‍🍳</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Preparing</p>
              <p className="text-lg font-semibold text-gray-900">
                {orders.filter(order => order.status === 'PREPARING').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-green-600 text-xl">🍽️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Ready</p>
              <p className="text-lg font-semibold text-gray-900">
                {orders.filter(order => order.status === 'READY').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-success-100 rounded-lg">
              <span className="text-success-600 text-xl">✅</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-lg font-semibold text-gray-900">
                {orders.filter(order => order.status === 'COMPLETED').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <OrderFilters 
        filters={filters} 
        onFiltersChange={setFilters}
        onReset={() => {
          setFilters({
            status: '',
            tableId: '',
            startDate: '',
            endDate: '',
            search: ''
          });
          setPagination(prev => ({ ...prev, page: 1 }));
        }}
      />

      {/* Orders List */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Orders ({pagination.total})
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Click on any order to view details and perform actions
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedOrders.length === orders.length && orders.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-600">Select All</span>
              </label>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          {isMobile ? (
            <div className="p-4 space-y-4">
              {orders.length === 0 ? (
                <div className="text-center text-gray-500">No orders found. Create your first order to get started!</div>
              ) : (
                orders.map(order => (
                  <div
                    key={order.id}
                    className="bg-white rounded-lg shadow border border-gray-200 p-4 flex flex-col gap-2 cursor-pointer hover:shadow-md transition"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-lg text-gray-900">#{order.orderNumber}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-700 mb-2">
                      <span>Table {order.table?.number || 'N/A'}</span>
                      <span>{order.orderItems?.length || 0} items</span>
                      <span>Total: <span className="font-semibold">${parseFloat(order.total).toFixed(2)}</span></span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>{new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString()}</span>
                      {order.paymentMethod && getPaymentMethodBadge(order.paymentMethod)}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedOrders.length === orders.length && orders.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Table
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px] whitespace-nowrap">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                      No orders found. Create your first order to get started!
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr 
                      key={order.id} 
                      className="hover:bg-primary-50 cursor-pointer transition-colors duration-200 border-l-4 border-transparent hover:border-primary-200"
                      onClick={() => setSelectedOrder(order)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedOrder(order);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`View details for order ${order.orderNumber}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order.id)}
                          onChange={() => handleSelectOrder(order.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Table {order.table?.number || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-col">
                          <span>{order.orderItems?.length || 0} items</span>
                          <span className="text-xs text-gray-400">
                            {order.orderItems?.slice(0, 2).map(item => item.product?.name).join(', ')}
                            {order.orderItems?.length > 2 && '...'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${parseFloat(order.total).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPaymentMethodBadge(order.paymentMethod)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap min-w-[140px]">
                        <div className="flex flex-col">
                          <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(order.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && !showEditModal && !showInvoiceModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border w-11/12 md:w-4/5 lg:w-3/4 shadow-xl rounded-lg bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Order #{selectedOrder.orderNumber}
                </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {getStatusBadge(selectedOrder.status)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Table</p>
                    <p className="text-sm text-gray-900">Table {selectedOrder.table?.number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <p className="text-sm">{getStatusBadge(selectedOrder.status)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Date</p>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedOrder.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Cashier</p>
                    <p className="text-sm text-gray-900">{selectedOrder.user?.name || 'N/A'}</p>
                  </div>
                  {selectedOrder.paymentMethod && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Payment Method</p>
                      <p className="text-sm">{getPaymentMethodBadge(selectedOrder.paymentMethod)}</p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Items</p>
                  <div className="space-y-2">
                    {selectedOrder.orderItems?.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.product?.name || 'Unknown Product'} x{item.quantity}</span>
                        <span>${parseFloat(item.subtotal).toFixed(2)}</span>
                      </div>
                    )) || <p className="text-gray-500">No items found</p>}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>${parseFloat(selectedOrder.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax:</span>
                    <span>${parseFloat(selectedOrder.tax).toFixed(2)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Discount:</span>
                      <span>-${parseFloat(selectedOrder.discount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-medium border-t pt-2 mt-2">
                    <span>Total:</span>
                    <span>${parseFloat(selectedOrder.total).toFixed(2)}</span>
                  </div>
                </div>

                {selectedOrder.customerNote && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Customer Note</p>
                    <p className="text-sm text-gray-900">{selectedOrder.customerNote}</p>
                  </div>
                )}

                <div className="border-t pt-6 mt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Actions</h4>
                  <div className="flex flex-wrap gap-3">
                  {selectedOrder.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleEditOrder(selectedOrder)}
                          className="btn-warning flex items-center gap-2"
                      >
                          <span>✏️</span>
                        Edit Order
                      </button>
                      <button
                        onClick={() => handlePrepareOrder(selectedOrder.id)}
                          className="btn-primary flex items-center gap-2"
                      >
                          <span>👨‍🍳</span>
                        Mark as Preparing
                      </button>
                    </>
                  )}
                  {selectedOrder.status === 'PREPARING' && (
                      <button
                        onClick={() => handleReadyOrder(selectedOrder.id)}
                        className="btn-success flex items-center gap-2"
                      >
                        <span>🍽️</span>
                        Mark as Ready
                      </button>
                  )}
                  {selectedOrder.status === 'READY' && (
                    <>
                      <button
                        onClick={() => handlePayment(selectedOrder.id, 'CASH')}
                          className="btn-success flex items-center gap-2"
                      >
                          <span>💰</span>
                        Pay Cash
                      </button>
                      <button
                        onClick={() => handlePayment(selectedOrder.id, 'CARD')}
                          className="btn-success flex items-center gap-2"
                      >
                          <span>💳</span>
                        Pay Card
                      </button>
                    </>
                  )}
                  {selectedOrder.status === 'COMPLETED' && (
                    <button
                      onClick={() => handlePrintInvoice(selectedOrder)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <span>🖨️</span>
                      Print Invoice
                    </button>
                  )}
                    {selectedOrder.status !== 'COMPLETED' && selectedOrder.status !== 'CANCELLED' && (
                      <button
                        onClick={() => handleCancelOrder(selectedOrder.id)}
                        className="btn-danger flex items-center gap-2"
                      >
                        <span>❌</span>
                        Cancel Order
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
    </div>
  );
};

export default Orders; 