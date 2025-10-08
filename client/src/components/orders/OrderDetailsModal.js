import React from 'react';
import Icon from '../common/Icon';

const OrderDetailsModal = ({ order, onClose, onEdit, onPayment, onCancel, onPrintInvoice }) => {
  if (!order) {
    return null;
  }

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') amount = Number(amount) || 0;
    return '$' + amount.toLocaleString(undefined, { minimumFractionDigits: 2 });
  };

  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { class: 'bg-yellow-100 text-yellow-700', icon: 'clock' },
      COMPLETED: { class: 'bg-green-100 text-green-700', icon: 'check' },
      CANCELLED: { class: 'bg-red-100 text-red-700', icon: 'close' }
    };
    
    const config = statusConfig[status] || { class: 'bg-gray-100 text-gray-700', icon: 'warning' };
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.class}`}>
        <Icon name={config.icon} size="sm" />
        {status}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <Icon name="orders" className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                Order #{order.orderNumber}
              </h3>
              <div className="mt-1">
                {getStatusBadge(order.status)}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
          >
            <Icon name="close" className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Order Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <Icon name="tables" className="w-5 h-5 text-gray-600" />
                <h4 className="font-semibold text-gray-900">Table Information</h4>
              </div>
              <p className="text-lg font-bold text-primary-600">Table {order.table?.number || 'N/A'}</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <Icon name="profile" className="w-5 h-5 text-gray-600" />
                <h4 className="font-semibold text-gray-900">Cashier</h4>
              </div>
              <p className="text-lg font-bold text-primary-600">{order.user?.name || 'N/A'}</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <Icon name="calendar" className="w-5 h-5 text-gray-600" />
                <h4 className="font-semibold text-gray-900">Date & Time</h4>
              </div>
              <p className="text-lg font-bold text-primary-600">
                {formatDate(order.createdAt)}
              </p>
            </div>
            
            {order.paymentMethod && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <Icon name="creditCard" className="w-5 h-5 text-gray-600" />
                  <h4 className="font-semibold text-gray-900">Payment Method</h4>
                </div>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                  <Icon name="creditCard" size="sm" />
                  {order.paymentMethod}
                </span>
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <Icon name="box" className="w-5 h-5 text-gray-600" />
              <h4 className="text-lg font-semibold text-gray-900">Order Items</h4>
            </div>
            
            <div className="space-y-3">
              {order.orderItems?.map((item, index) => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <span className="font-medium text-gray-900">{item.product?.name || 'Unknown Product'}</span>
                    <span className="text-sm text-gray-500">x{item.quantity}</span>
                  </div>
                  <span className="font-bold text-primary-600">{formatCurrency(item.subtotal)}</span>
                </div>
              )) || <p className="text-gray-500 text-center py-4">No items found</p>}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <Icon name="clipboard" className="w-5 h-5 text-gray-600" />
              <h4 className="text-lg font-semibold text-gray-900">Order Summary</h4>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold text-gray-900">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Tax:</span>
                <span className="font-semibold text-gray-900">{formatCurrency(order.tax)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-semibold text-red-600">-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-lg font-bold border-t border-gray-300 pt-3">
                <span className="text-gray-900">Total:</span>
                <span className="text-primary-600">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Customer Note */}
          {order.customerNote && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="flex items-center space-x-3 mb-3">
                <Icon name="info" className="w-5 h-5 text-gray-600" />
                <h4 className="font-semibold text-gray-900">Customer Note</h4>
              </div>
              <p className="text-gray-700 bg-white p-3 rounded-lg">
                {order.customerNote}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {order.status === 'PENDING' && onEdit && (
              <button
                onClick={() => onEdit(order)}
                className="btn-warning flex items-center space-x-2"
              >
                <Icon name="edit" size="sm" />
                <span>Edit Order</span>
              </button>
            )}
            
            {order.status === 'PENDING' && onPayment && (
              <button
                onClick={() => onPayment(order.id)}
                className="btn-success flex items-center space-x-2"
              >
                <Icon name="creditCard" size="sm" />
                <span>Process Payment</span>
              </button>
            )}
            
            {order.status === 'COMPLETED' && onPrintInvoice && (
              <button
                onClick={() => onPrintInvoice(order)}
                className="btn-primary flex items-center space-x-2"
              >
                <Icon name="download" size="sm" />
                <span>Print Invoice</span>
              </button>
            )}
            
            {order.status === 'PENDING' && onCancel && (
              <button
                onClick={() => onCancel(order.id)}
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
  );
};

export default OrderDetailsModal;






