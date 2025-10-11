import React, { useRef, useState, useMemo, useCallback } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useSettings } from '../../contexts/SettingsContext';
import Icon from '../common/Icon';
import { toast } from 'react-toastify';

const EnhancedReceiptModal = ({ order, onClose, onPaymentSuccess }) => {
  const printRef = useRef();
  const { settings, formatCurrency, getTaxRate } = useSettings();
  const [isPrinting, setIsPrinting] = useState(false);
  const [receiptType, setReceiptType] = useState('customer'); // customer, kitchen, manager
  const [showPaymentDetails, setShowPaymentDetails] = useState(true);
  const [showItemDetails, setShowItemDetails] = useState(true);
  const [showBusinessInfo, setShowBusinessInfo] = useState(true);
  
  // Use business snapshot from order if available, otherwise use current settings
  let businessSnapshot = order.businessSnapshot || {};
  if (typeof businessSnapshot === 'string') {
    try {
      businessSnapshot = JSON.parse(businessSnapshot);
    } catch (error) {
      console.error('Failed to parse business snapshot:', error);
      businessSnapshot = {};
    }
  }
  const currentBusiness = settings.business || {};
  const business = businessSnapshot.restaurantName ? businessSnapshot : currentBusiness;
  
  // Get VAT rate from business snapshot
  const getOrderVATRate = () => {
    return business.vatRate || business.taxRate || getTaxRate();
  };

  // Enhanced memoized calculations
  const receiptData = useMemo(() => {
    if (!order) return null;
    
    const subtotal = parseFloat(order.subtotal) || 0;
    const tax = parseFloat(order.tax) || 0;
    const discount = parseFloat(order.discount) || 0;
    const total = parseFloat(order.total) || 0;
    
    // Calculate payment details
    const paymentDetails = {
      method: order.paymentMethod || 'CASH',
      currency: order.currency || 'USD',
      splitBill: order.splitBill || false,
      mixedPayments: order.mixedPayments || false,
      splitAmounts: order.splitAmounts ? JSON.parse(order.splitAmounts) : [],
      paymentMethods: order.paymentMethods ? JSON.parse(order.paymentMethods) : [],
      mixedCurrency: order.mixedCurrency || false
    };
    
    return {
      subtotal,
      tax,
      discount,
      total,
      itemCount: order.orderItems?.length || 0,
      paymentDetails,
      formattedDate: new Date(order.createdAt).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      shortDate: new Date(order.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      time: new Date(order.createdAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      orderNumber: order.orderNumber,
      tableName: order.table?.number ? `Table ${order.table.number}` : 'N/A',
      cashierName: order.user?.name || order.user?.username || 'N/A'
    };
  }, [order]);

  // Enhanced print handler with multiple receipt types
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${receiptType}-receipt-${order.orderNumber}`,
    onBeforeGetContent: () => {
      setIsPrinting(true);
      
      // Add print-specific styles
      const style = document.createElement('style');
      style.textContent = `
        @media print {
          @page {
            margin: 0.2in;
            size: 80mm 297mm;
          }
          
          .receipt-container {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.2;
            color: #000;
            background: white;
          }
          
          .receipt-header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 2px dashed #000;
            padding-bottom: 10px;
          }
          
          .receipt-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .receipt-subtitle {
            font-size: 12px;
            color: #666;
          }
          
          .receipt-info {
            margin-bottom: 15px;
            font-size: 11px;
          }
          
          .receipt-items {
            margin-bottom: 15px;
          }
          
          .receipt-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
            padding: 2px 0;
          }
          
          .receipt-item-name {
            flex: 1;
            font-weight: bold;
          }
          
          .receipt-item-details {
            font-size: 10px;
            color: #666;
            margin-left: 10px;
          }
          
          .receipt-item-price {
            font-weight: bold;
            text-align: right;
          }
          
          .receipt-totals {
            border-top: 1px solid #000;
            padding-top: 10px;
            margin-top: 10px;
          }
          
          .receipt-total-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
          }
          
          .receipt-total-final {
            border-top: 2px solid #000;
            font-weight: bold;
            font-size: 14px;
            padding-top: 5px;
            margin-top: 5px;
          }
          
          .receipt-payment {
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px dashed #000;
          }
          
          .receipt-footer {
            text-align: center;
            margin-top: 20px;
            font-size: 10px;
            color: #666;
          }
          
          .receipt-qr {
            text-align: center;
            margin: 15px 0;
          }
          
          .no-print {
            display: none;
          }
        }
      `;
      document.head.appendChild(style);
      
      setTimeout(() => {
        if (document.head.contains(style)) {
          document.head.removeChild(style);
        }
      }, 1000);
    },
    onAfterPrint: () => {
      setIsPrinting(false);
      toast.success(`${receiptType.charAt(0).toUpperCase() + receiptType.slice(1)} receipt printed successfully!`);
    },
    onPrintError: (error) => {
      console.error('Print failed:', error);
      setIsPrinting(false);
      toast.error('Print failed. Please try again.');
    }
  });

  // Generate QR code data for receipt
  const generateQRData = useCallback(() => {
    const qrData = {
      orderNumber: order.orderNumber,
      total: order.total,
      date: order.createdAt,
      restaurant: business.restaurantName || 'Restaurant',
      table: order.table?.number ? `Table ${order.table.number}` : 'N/A'
    };
    return JSON.stringify(qrData);
  }, [order, business]);

  // Format payment details for display
  const formatPaymentDetails = useCallback(() => {
    if (!receiptData?.paymentDetails) return null;
    
    const { paymentDetails } = receiptData;
    
    if (paymentDetails.splitBill && paymentDetails.splitAmounts.length > 0) {
      return (
        <div className="receipt-payment">
          <div className="text-center font-bold mb-2">Split Payment Details</div>
          {paymentDetails.splitAmounts.map((split, index) => (
            <div key={index} className="mb-2">
              <div className="font-semibold">Split {index + 1}: ${split.amount}</div>
              {split.paymentMethods && split.paymentMethods.length > 0 && (
                <div className="text-sm text-gray-600">
                  {split.paymentMethods.map((method, methodIndex) => (
                    <div key={methodIndex}>
                      {method.method}: ${method.amount} ({method.currency})
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }
    
    if (paymentDetails.mixedPayments && paymentDetails.paymentMethods.length > 0) {
      return (
        <div className="receipt-payment">
          <div className="text-center font-bold mb-2">Payment Details</div>
          {paymentDetails.paymentMethods.map((method, index) => (
            <div key={index} className="flex justify-between">
              <span>{method.method}:</span>
              <span>${method.amount} ({method.currency})</span>
            </div>
          ))}
        </div>
      );
    }
    
    return (
      <div className="receipt-payment">
        <div className="flex justify-between">
          <span>Payment Method:</span>
          <span>{paymentDetails.method}</span>
        </div>
        <div className="flex justify-between">
          <span>Currency:</span>
          <span>{paymentDetails.currency}</span>
        </div>
      </div>
    );
  }, [receiptData]);

  if (!order || !receiptData) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Icon name="receipt" className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">Enhanced Receipt</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Icon name="close" className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Receipt Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Receipt Type</label>
              <select
                value={receiptType}
                onChange={(e) => setReceiptType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="customer">Customer Receipt</option>
                <option value="kitchen">Kitchen Receipt</option>
                <option value="manager">Manager Copy</option>
                <option value="tax">VAT Receipt</option>
              </select>
            </div>

            {/* Display Options */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Display Options</label>
              <div className="space-y-1">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showPaymentDetails}
                    onChange={(e) => setShowPaymentDetails(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Payment Details</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showItemDetails}
                    onChange={(e) => setShowItemDetails(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Item Details</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showBusinessInfo}
                    onChange={(e) => setShowBusinessInfo(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Business Info</span>
                </label>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Quick Actions</label>
              <div className="space-y-1">
                <button
                  onClick={() => setReceiptType('customer')}
                  className="w-full px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  Customer Copy
                </button>
                <button
                  onClick={() => setReceiptType('kitchen')}
                  className="w-full px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                >
                  Kitchen Copy
                </button>
              </div>
            </div>

            {/* Print Button */}
            <div className="flex flex-col justify-end">
              <button
                onClick={handlePrint}
                disabled={isPrinting}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {isPrinting ? (
                  <>
                    <Icon name="loading" className="w-4 h-4 animate-spin" />
                    <span>Printing...</span>
                  </>
                ) : (
                  <>
                    <Icon name="print" className="w-4 h-4" />
                    <span>Print Receipt</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Receipt Preview */}
        <div className="p-6 overflow-y-auto max-h-96">
          <div ref={printRef} className="receipt-container bg-white p-4 border border-gray-200 rounded-lg">
            {/* Receipt Header */}
            {showBusinessInfo && (
              <div className="receipt-header">
                <div className="receipt-title">{business.restaurantName || 'Restaurant'}</div>
                <div className="receipt-subtitle">
                  {business.address && <div>{business.address}</div>}
                  {business.phone && <div>Tel: {business.phone}</div>}
                  {business.email && <div>Email: {business.email}</div>}
                </div>
              </div>
            )}

            {/* Receipt Info */}
            <div className="receipt-info">
              <div className="flex justify-between">
                <span>Receipt #:</span>
                <span className="font-bold">{receiptData.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{receiptData.shortDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Time:</span>
                <span>{receiptData.time}</span>
              </div>
              <div className="flex justify-between">
                <span>Table:</span>
                <span>{receiptData.tableName}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span>{receiptData.cashierName}</span>
              </div>
              {receiptType !== 'customer' && (
                <div className="flex justify-between">
                  <span>Receipt Type:</span>
                  <span className="font-semibold">{receiptType.toUpperCase()}</span>
                </div>
              )}
            </div>

            {/* Receipt Items */}
            {showItemDetails && (
              <div className="receipt-items">
                <div className="text-center font-bold mb-2 border-b border-gray-300 pb-1">
                  {receiptType === 'kitchen' ? 'KITCHEN ORDER' : 'ORDER ITEMS'}
                </div>
                {order.orderItems?.map((item, index) => (
                  <div key={index} className="receipt-item">
                    <div className="receipt-item-name">
                      {item.quantity}x {item.product.name}
                      {item.notes && (
                        <div className="receipt-item-details">
                          Note: {item.notes}
                        </div>
                      )}
                    </div>
                    <div className="receipt-item-price">
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Receipt Totals */}
            <div className="receipt-totals">
              <div className="receipt-total-line">
                <span>Subtotal:</span>
                <span>{formatCurrency(receiptData.subtotal)}</span>
              </div>
              {receiptData.tax > 0 && (
                <div className="receipt-total-line">
                  <span>VAT ({getOrderVATRate()}%):</span>
                  <span>{formatCurrency(receiptData.tax)}</span>
                </div>
              )}
              {receiptData.discount > 0 && (
                <div className="receipt-total-line">
                  <span>Discount ({Math.round((parseFloat(receiptData.discount) / (order.orderItems.reduce((sum, item) => sum + parseFloat(item.subtotal), 0))) * 100)}%):</span>
                  <span>-{formatCurrency(receiptData.discount)}</span>
                </div>
              )}
              <div className="receipt-total-final">
                <div className="flex justify-between">
                  <span>TOTAL:</span>
                  <span>{formatCurrency(receiptData.total)}</span>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            {showPaymentDetails && formatPaymentDetails()}

            {/* QR Code for Customer Receipt */}
            {receiptType === 'customer' && (
              <div className="receipt-qr">
                <div className="text-center text-xs text-gray-600 mb-2">
                  Scan for order details
                </div>
                <div className="text-center text-xs font-mono bg-gray-100 p-2 rounded">
                  {generateQRData()}
                </div>
              </div>
            )}

            {/* Receipt Footer */}
            <div className="receipt-footer">
              <div>Thank you for your business!</div>
              {business.website && <div>Visit us at: {business.website}</div>}
              <div>Generated on: {new Date().toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            disabled={isPrinting}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <Icon name="print" className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedReceiptModal;

