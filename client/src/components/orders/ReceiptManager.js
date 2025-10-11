import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Icon from '../common/Icon';
import EnhancedReceiptModal from './EnhancedReceiptModal';

const ReceiptManager = ({ onClose }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: 'today',
    status: 'all',
    paymentMethod: 'all',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
  });

  // Fetch orders for receipt management
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      const response = await axios.get(`/api/orders?${params}`);
      setOrders(response.data.orders || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0
      }));
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Filter orders based on current filters
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Date range filter
      const orderDate = new Date(order.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const thisWeek = new Date(today);
      thisWeek.setDate(thisWeek.getDate() - 7);
      const thisMonth = new Date(today);
      thisMonth.setMonth(thisMonth.getMonth() - 1);

      let dateMatch = true;
      switch (filters.dateRange) {
        case 'today':
          dateMatch = orderDate.toDateString() === today.toDateString();
          break;
        case 'yesterday':
          dateMatch = orderDate.toDateString() === yesterday.toDateString();
          break;
        case 'thisWeek':
          dateMatch = orderDate >= thisWeek;
          break;
        case 'thisMonth':
          dateMatch = orderDate >= thisMonth;
          break;
        default:
          dateMatch = true;
      }

      // Status filter
      const statusMatch = filters.status === 'all' || order.status === filters.status;

      // Payment method filter
      const paymentMatch = filters.paymentMethod === 'all' || order.paymentMethod === filters.paymentMethod;

      // Search filter
      const searchMatch = filters.search === '' || 
        order.orderNumber.toLowerCase().includes(filters.search.toLowerCase()) ||
        order.table?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        order.user?.name?.toLowerCase().includes(filters.search.toLowerCase());

      return dateMatch && statusMatch && paymentMatch && searchMatch;
    });
  }, [orders, filters]);

  // Handle receipt generation
  const handleGenerateReceipt = useCallback((order) => {
    setSelectedOrder(order);
    setShowReceiptModal(true);
  }, []);

  // Handle bulk receipt generation
  const handleBulkReceipts = useCallback(async (receiptType = 'customer') => {
    try {
      const selectedOrders = filteredOrders.filter(order => order.status === 'COMPLETED');
      
      if (selectedOrders.length === 0) {
        toast.warning('No completed orders found for receipt generation');
        return;
      }

      // Generate receipts for all selected orders
      for (const order of selectedOrders) {
        // Simulate receipt generation (in real implementation, this would trigger actual printing)
        console.log(`Generating ${receiptType} receipt for order ${order.orderNumber}`);
      }

      toast.success(`Generated ${selectedOrders.length} ${receiptType} receipts`);
    } catch (error) {
      console.error('Bulk receipt generation failed:', error);
      toast.error('Failed to generate bulk receipts');
    }
  }, [filteredOrders]);

  // Handle receipt reprint
  const handleReprint = useCallback((order) => {
    setSelectedOrder(order);
    setShowReceiptModal(true);
  }, []);

  // Get payment method badge
  const getPaymentMethodBadge = (method) => {
    const colors = {
      'CASH': 'bg-green-100 text-green-800',
      'CARD': 'bg-blue-100 text-blue-800',
      'QR': 'bg-purple-100 text-purple-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[method] || 'bg-gray-100 text-gray-800'}`}>
        {method}
      </span>
    );
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const colors = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'PREPARING': 'bg-blue-100 text-blue-800',
      'READY': 'bg-green-100 text-green-800',
      'COMPLETED': 'bg-gray-100 text-gray-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 text-center">
          <Icon name="loading" className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading receipts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Icon name="receipt" className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">Receipt Manager</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Icon name="close" className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="thisWeek">This Week</option>
                <option value="thisMonth">This Month</option>
                <option value="all">All Time</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending</option>
                <option value="PREPARING">Preparing</option>
                <option value="READY">Ready</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <select
                value={filters.paymentMethod}
                onChange={(e) => setFilters(prev => ({ ...prev, paymentMethod: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Methods</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="QR">QR Code</option>
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Order #, Table, Cashier..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Bulk Actions */}
            <div className="flex flex-col justify-end">
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkReceipts('customer')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Bulk Customer
                </button>
                <button
                  onClick={() => handleBulkReceipts('kitchen')}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                >
                  Bulk Kitchen
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Icon name="receipt" className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
              <p className="text-gray-500">No orders match your current filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">#{order.orderNumber}</h3>
                        {getStatusBadge(order.status)}
                        {order.paymentMethod && getPaymentMethodBadge(order.paymentMethod)}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Table:</span> {order.table?.number ? `Table ${order.table.number}` : 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Cashier:</span> {order.user?.name || order.user?.username || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Date:</span> {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Total:</span> ${parseFloat(order.total).toFixed(2)}
                        </div>
                      </div>

                      {order.orderItems && order.orderItems.length > 0 && (
                        <div className="mt-2">
                          <span className="text-sm text-gray-500">
                            {order.orderItems.length} item(s) - {order.orderItems.reduce((sum, item) => sum + item.quantity, 0)} total
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleGenerateReceipt(order)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center space-x-2"
                      >
                        <Icon name="receipt" className="w-4 h-4" />
                        <span>Generate Receipt</span>
                      </button>
                      
                      {order.status === 'COMPLETED' && (
                        <button
                          onClick={() => handleReprint(order)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center space-x-2"
                        >
                          <Icon name="print" className="w-4 h-4" />
                          <span>Reprint</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page * pagination.limit >= pagination.total}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Receipt Modal */}
      {showReceiptModal && selectedOrder && (
        <EnhancedReceiptModal
          order={selectedOrder}
          onClose={() => {
            setShowReceiptModal(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
};

export default ReceiptManager;

