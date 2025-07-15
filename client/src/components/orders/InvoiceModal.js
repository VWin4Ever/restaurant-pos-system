import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useSettings } from '../../contexts/SettingsContext';
import Icon from '../common/Icon';
import logo from '../../assets/logo.png';

const InvoiceModal = ({ order, onClose }) => {
  const printRef = useRef();
  const { settings, loading, formatCurrency } = useSettings();
  
  // Use business snapshot from order if available, otherwise use current settings
  const businessSnapshot = order.businessSnapshot || {};
  const currentBusiness = settings.business || {};
  const business = businessSnapshot.restaurantName ? businessSnapshot : currentBusiness;
  const taxRate = business.taxRate || 0;

  // Always call hooks at the top level!
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Invoice-${order.orderNumber}`,
    onAfterPrint: () => {
      console.log('Print completed');
    }
  });

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-primary-900/50 to-secondary-900/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600 text-lg">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: 'clock' },
      COMPLETED: { color: 'bg-green-100 text-green-800 border-green-200', icon: 'check' },
      CANCELLED: { color: 'bg-red-100 text-red-800 border-red-200', icon: 'close' },
      PREPARING: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: 'clock' },
      READY: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: 'clock' }
    };
    
    const config = statusConfig[status] || statusConfig.PENDING;
    const displayStatus = status === 'PREPARING' || status === 'READY' ? 'PENDING' : status;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
        <Icon name={config.icon} className="w-4 h-4" />
        {displayStatus}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary-900/50 to-secondary-900/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 border-0 w-11/12 md:w-4/5 lg:w-3/4 shadow-2xl rounded-2xl bg-gradient-to-br from-white to-gray-50 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
              <Icon name="receipt" className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Invoice
              </h2>
              <p className="text-gray-600">#{order.orderNumber}</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <Icon name="print" className="w-5 h-5" />
              Print Invoice
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400 rounded-lg p-2"
            >
              <Icon name="close" className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Printable Invoice */}
        <div ref={printRef} className="bg-white p-8 max-w-4xl mx-auto rounded-xl shadow-lg border border-gray-200">
          {/* Header */}
          <div className="text-center mb-8 pb-6 border-b border-gray-200">
            <div className="flex flex-col items-center mb-4">
              <img src={logo} alt="Angkor Holiday Hotel Logo" className="h-12 w-auto mb-2 rounded-lg shadow" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">{business.restaurantName || 'RESTAURANT POS'}</h1>
            {business.address && (
              <p className="text-gray-600 flex items-center justify-center gap-2 mb-1">
                <Icon name="location" className="w-4 h-4" />
                {business.address}
              </p>
            )}
            {business.phone && (
              <p className="text-gray-600 flex items-center justify-center gap-2 mb-1">
                <Icon name="phone" className="w-4 h-4" />
                {business.phone}
              </p>
            )}
            {business.email && (
              <p className="text-gray-600 flex items-center justify-center gap-2">
                <Icon name="email" className="w-4 h-4" />
                {business.email}
              </p>
            )}
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-gradient-to-r from-primary-50 to-secondary-50 p-6 rounded-xl border border-primary-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Icon name="user" className="w-5 h-5 text-primary-600" />
                Invoice To:
              </h3>
              <div className="space-y-2">
                <p className="text-gray-700 flex items-center gap-2">
                  <Icon name="table" className="w-4 h-4 text-primary-500" />
                  Table {order.table?.number}
                </p>
                <p className="text-gray-700 flex items-center gap-2">
                  <Icon name="calendar" className="w-4 h-4 text-primary-500" />
                  Order Date: {formatDate(order.createdAt)}
                </p>
                <p className="text-gray-700 flex items-center gap-2">
                  <Icon name="user" className="w-4 h-4 text-primary-500" />
                  Cashier: {order.user?.name}
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-secondary-50 to-primary-50 p-6 rounded-xl border border-secondary-200 text-right">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2 justify-end">
                <Icon name="info" className="w-5 h-5 text-secondary-600" />
                Invoice Details:
              </h3>
              <div className="space-y-2">
                <p className="text-gray-700 flex items-center gap-2 justify-end">
                  <Icon name="receipt" className="w-4 h-4 text-secondary-500" />
                  Invoice #: {order.orderNumber}
                </p>
                <p className="text-gray-700 flex items-center gap-2 justify-end">
                  <Icon name="status" className="w-4 h-4 text-secondary-500" />
                  Status: {getStatusBadge(order.status)}
                </p>
                {order.paymentMethod && (
                  <p className="text-gray-700 flex items-center gap-2 justify-end">
                    <Icon name="payment" className="w-4 h-4 text-secondary-500" />
                    Payment: {order.paymentMethod}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-primary-50 to-secondary-50 p-4 rounded-t-xl border border-primary-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Icon name="list" className="w-5 h-5 text-primary-600" />
                Order Items
              </h3>
            </div>
            <div className="overflow-hidden border border-gray-300 rounded-b-xl">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-primary-100 to-secondary-100">
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-900">
                      <div className="flex items-center gap-2">
                        <Icon name="food" className="w-4 h-4" />
                        Item
                      </div>
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-900">
                      <div className="flex items-center gap-2 justify-center">
                        <Icon name="category" className="w-4 h-4" />
                        Category
                      </div>
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-900">
                      <div className="flex items-center gap-2 justify-center">
                        <Icon name="quantity" className="w-4 h-4" />
                        Qty
                      </div>
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-900">
                      <div className="flex items-center gap-2 justify-end">
                        <Icon name="currency" className="w-4 h-4" />
                        Price
                      </div>
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-900">
                      <div className="flex items-center gap-2 justify-end">
                        <Icon name="total" className="w-4 h-4" />
                        Total
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {order.orderItems?.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-300 px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{item.product?.name}</p>
                          {item.product?.description && (
                            <p className="text-sm text-gray-600">{item.product.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm">
                          <Icon name="category" className="w-3 h-3" />
                          {item.product?.category?.name}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        <span className="font-semibold text-gray-900">{item.quantity}</span>
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-right">
                        <span className="font-medium text-gray-900">{formatCurrency(item.price)}</span>
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-right font-medium">
                        <span className="text-primary-600 font-semibold">{formatCurrency(item.subtotal)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Customer Note */}
          {order.customerNote && (
            <div className="mb-8 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Icon name="note" className="w-5 h-5 text-yellow-600" />
                Special Instructions:
              </h4>
              <p className="text-gray-700">{order.customerNote}</p>
            </div>
          )}

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-80 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl p-6 border border-primary-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Icon name="calculator" className="w-5 h-5 text-primary-600" />
                Order Summary
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 flex items-center gap-2">
                    <Icon name="receipt" className="w-4 h-4 text-gray-500" />
                    Subtotal:
                  </span>
                  <span className="font-medium text-gray-900">{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 flex items-center gap-2">
                    <Icon name="tax" className="w-4 h-4 text-gray-500" />
                    Tax ({taxRate}%):
                  </span>
                  <span className="font-medium text-gray-900">{formatCurrency(order.tax)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 flex items-center gap-2">
                      <Icon name="discount" className="w-4 h-4 text-gray-500" />
                      Discount:
                    </span>
                    <span className="font-medium text-red-600">-{formatCurrency(order.discount)}</span>
                  </div>
                )}
                <div className="border-t border-primary-200 pt-3">
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span className="text-gray-900 flex items-center gap-2">
                      <Icon name="total" className="w-5 h-5 text-primary-600" />
                      Total:
                    </span>
                    <span className="text-primary-600 font-bold">{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-gray-600 text-sm border-t border-gray-200 pt-8">
            <div className="mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <Icon name="heart" className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-lg font-semibold text-gray-900 mb-2">Thank you for your business!</p>
            <p className="mb-2">Please visit us again</p>
            <p className="text-xs text-gray-500 mt-4">
              This is a computer-generated invoice. No signature required.
            </p>
          </div>
        </div>

        {/* Print Instructions */}
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
            <Icon name="info" className="w-5 h-5 text-blue-600" />
            Print Instructions:
          </h4>
          <ul className="text-sm text-blue-800 space-y-2">
            <li className="flex items-center gap-2">
              <Icon name="print" className="w-4 h-4 text-blue-600" />
              Click "Print Invoice" to print this receipt
            </li>
            <li className="flex items-center gap-2">
              <Icon name="document" className="w-4 h-4 text-blue-600" />
              The print will include all order details and totals
            </li>
            <li className="flex items-center gap-2">
              <Icon name="download" className="w-4 h-4 text-blue-600" />
              You can also save as PDF from the print dialog
            </li>
            <li className="flex items-center gap-2">
              <Icon name="close" className="w-4 h-4 text-blue-600" />
              Close this modal when finished
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal; 