import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

const InvoiceModal = ({ order, onClose }) => {
  const printRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Invoice-${order.orderNumber}`,
    onAfterPrint: () => {
      console.log('Print completed');
    }
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      PENDING: 'order-status-pending',
      COMPLETED: 'order-status-completed',
      CANCELLED: 'order-status-cancelled',
      PREPARING: 'order-status-preparing',
      READY: 'order-status-ready'
    };
    return (
      <span className={`order-status ${statusClasses[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Invoice - {order.orderNumber}
          </h2>
          <div className="flex space-x-3">
            <button
              onClick={handlePrint}
              className="btn-primary"
            >
              🖨️ Print Invoice
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Invoice */}
        <div ref={printRef} className="bg-white p-8 max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">RESTAURANT POS</h1>
            <p className="text-gray-600">123 Main Street, City, State 12345</p>
            <p className="text-gray-600">Phone: (555) 123-4567</p>
            <p className="text-gray-600">Email: info@restaurant.com</p>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Invoice To:</h3>
              <p className="text-gray-700">Table {order.table?.number}</p>
              <p className="text-gray-700">Order Date: {formatDate(order.createdAt)}</p>
              <p className="text-gray-700">Cashier: {order.user?.name}</p>
            </div>
            <div className="text-right">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Invoice Details:</h3>
              <p className="text-gray-700">Invoice #: {order.orderNumber}</p>
              <p className="text-gray-700">Status: {getStatusBadge(order.status)}</p>
              {order.paymentMethod && (
                <p className="text-gray-700">Payment: {order.paymentMethod}</p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Item</th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Category</th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Qty</th>
                  <th className="border border-gray-300 px-4 py-2 text-right font-semibold">Price</th>
                  <th className="border border-gray-300 px-4 py-2 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.orderItems?.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-300 px-4 py-2">
                      <div>
                        <p className="font-medium">{item.product?.name}</p>
                        {item.product?.description && (
                          <p className="text-sm text-gray-600">{item.product.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {item.product?.category?.name}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {item.quantity}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      ${parseFloat(item.price).toFixed(2)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right font-medium">
                      ${parseFloat(item.subtotal).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Customer Note */}
          {order.customerNote && (
            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Special Instructions:</h4>
              <p className="text-gray-700">{order.customerNote}</p>
            </div>
          )}

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-80">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-700">Subtotal:</span>
                  <span className="font-medium">${parseFloat(order.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Tax (10%):</span>
                  <span className="font-medium">${parseFloat(order.tax).toFixed(2)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-700">Discount:</span>
                    <span className="font-medium text-red-600">-${parseFloat(order.discount).toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>${parseFloat(order.total).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-gray-600 text-sm border-t pt-8">
            <p>Thank you for your business!</p>
            <p className="mt-2">Please visit us again</p>
            <p className="mt-4 text-xs">
              This is a computer-generated invoice. No signature required.
            </p>
          </div>
        </div>

        {/* Print Instructions */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Print Instructions:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Click "Print Invoice" to print this receipt</li>
            <li>• The print will include all order details and totals</li>
            <li>• You can also save as PDF from the print dialog</li>
            <li>• Close this modal when finished</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal; 