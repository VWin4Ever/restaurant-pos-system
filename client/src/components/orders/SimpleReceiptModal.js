import React, { useRef, useState, useMemo } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useSettings } from '../../contexts/SettingsContext';
import Icon from '../common/Icon';
import { toast } from 'react-toastify';

const SimpleReceiptModal = ({ order, onClose, splitIndex = null, receiptType = 'final', paymentData = null }) => {
  const printRef = useRef();
  const { settings, formatCurrency, getTaxRate } = useSettings();
  const [isPrinting, setIsPrinting] = useState(false);
  
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

  // Calculate receipt data based on split or full payment
  const receiptData = useMemo(() => {
    if (!order) return null;
    
    const subtotal = parseFloat(order.subtotal) || 0;
    const tax = parseFloat(order.tax) || 0;
    const discount = parseFloat(order.discount) || 0;
    const total = parseFloat(order.total) || 0;
    
    // Handle draft receipt with payment data
    if (receiptType === 'draft' && paymentData) {
      const { activeTab, paymentPanels } = paymentData || {};
      
      // Ensure paymentPanels is an array
      const safePaymentPanels = Array.isArray(paymentPanels) ? paymentPanels : [];
      
      // If no payment data, show original order total
      if (safePaymentPanels.length === 0) {
        return {
          subtotal,
          tax,
          discount,
          total,
          itemCount: order.orderItems?.length || 0,
          isSplit: false,
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
      }
    
      if (activeTab === 'split' && safePaymentPanels.length > 0 && receiptType === 'draft') {
        // If we have a specific splitIndex, show only that split
        if (splitIndex !== null && splitIndex >= 0 && splitIndex < safePaymentPanels.length) {
          const selectedPanel = safePaymentPanels[splitIndex];
          const splitAmount = parseFloat(selectedPanel.amount) || 0;
          
          // Calculate proportional VAT and discount for this split
          const totalSubtotal = order.orderItems.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
          const splitRatio = totalSubtotal > 0 ? splitAmount / totalSubtotal : 0;
          const proportionalTax = (parseFloat(order.tax) || 0) * splitRatio;
          const proportionalDiscount = (parseFloat(order.discount) || 0) * splitRatio;
          
          return {
            subtotal: splitAmount,
            tax: Math.round(proportionalTax * 100) / 100,
            discount: Math.round(proportionalDiscount * 100) / 100,
            total: splitAmount,
            itemCount: order.orderItems?.length || 0,
            isSplit: true,
            splitNumber: splitIndex + 1,
            totalSplits: safePaymentPanels.length,
            splitPaymentMethods: [{ method: selectedPanel.method, amount: selectedPanel.amount, currency: selectedPanel.currency }],
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
        } else {
          // Show all splits (this shouldn't happen in normal flow)
          const splitAmounts = safePaymentPanels.map(panel => ({
            amount: parseFloat(panel.amount) || 0,
            paymentMethods: [{ method: panel.method, amount: panel.amount, currency: panel.currency }]
          }));
          
          return {
            subtotal,
            tax,
            discount,
            total,
            itemCount: order.orderItems?.length || 0,
            isSplit: true,
            splitNumber: 1,
            totalSplits: safePaymentPanels.length,
            splitAmounts: splitAmounts,
            draftPaymentMethods: safePaymentPanels,
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
        }
      } else {
        // Full payment draft
        const totalPayment = safePaymentPanels.reduce((sum, panel) => {
          const amount = parseFloat(panel.amount) || 0;
          if (panel.currency === 'USD') {
            return sum + amount;
          } else if (panel.currency === 'Riel') {
            return sum + (amount / 4100); // Convert Riel to USD
          }
          return sum;
        }, 0);
        
        return {
          subtotal,
          tax,
          discount,
          total: totalPayment,
          itemCount: order.orderItems?.length || 0,
          isSplit: false,
          draftPaymentMethods: safePaymentPanels,
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
      }
    }
    
    // Handle split payment
    if (splitIndex !== null && order.splitBill && order.splitAmounts) {
      const splitAmounts = JSON.parse(order.splitAmounts);
      const split = splitAmounts[splitIndex];
      
      if (split) {
        // Calculate proportional VAT and discount for this split
        const totalSubtotal = order.orderItems.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
        const splitAmount = parseFloat(split.amount) || 0;
        const splitRatio = totalSubtotal > 0 ? splitAmount / totalSubtotal : 0;
        const proportionalTax = (parseFloat(order.tax) || 0) * splitRatio;
        const proportionalDiscount = (parseFloat(order.discount) || 0) * splitRatio;
        
        return {
          subtotal: splitAmount,
          tax: Math.round(proportionalTax * 100) / 100,
          discount: Math.round(proportionalDiscount * 100) / 100,
          total: splitAmount,
          itemCount: order.orderItems?.length || 0,
          isSplit: true,
          splitNumber: splitIndex + 1,
          totalSplits: splitAmounts.length,
          splitPaymentMethods: split.paymentMethods || [],
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
      }
    }
    
    // Handle final receipts - always show full order details
    if (receiptType === 'final') {
      return {
        subtotal,
        tax,
        discount,
        total,
        itemCount: order.orderItems?.length || 0,
        isSplit: false, // Always false for final receipts
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
    }
    
    // Full payment receipt
    return {
      subtotal,
      tax,
      discount,
      total,
      itemCount: order.orderItems?.length || 0,
      isSplit: false, // Always false for full payment receipts
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
  }, [order, splitIndex, receiptType, paymentData]);

  // Simple print handler
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Receipt-${order.orderNumber}${splitIndex !== null ? `-Split-${splitIndex + 1}` : ''}`,
    onBeforeGetContent: () => {
      setIsPrinting(true);
      
      // Add print-specific styles for thermal printer format
      const style = document.createElement('style');
      style.textContent = `
        @media print {
          @page {
            margin: 0.1in;
            size: 80mm 297mm;
          }
          
          .receipt-container {
            font-family: 'Courier New', monospace;
            font-size: 11px;
            line-height: 1.1;
            color: #000;
            background: white;
            width: 100%;
            max-width: 80mm;
            margin: 0 auto;
          }
          
          .receipt-header {
            text-align: center;
            margin-bottom: 8px;
            padding-bottom: 8px;
          }
          
          .receipt-title {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 2px;
            text-transform: uppercase;
          }
          
          .receipt-subtitle {
            font-size: 10px;
            line-height: 1.2;
            margin-bottom: 4px;
          }
          
          .dotted-line {
            border-top: 1px dotted #000;
            margin: 4px 0;
            height: 1px;
          }
          
          .receipt-info {
            margin-bottom: 8px;
            font-size: 10px;
          }
          
          .receipt-items {
            margin-bottom: 8px;
          }
          
          .receipt-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 1px;
            padding: 1px 0;
            font-size: 10px;
          }
          
          .receipt-item-name {
            flex: 1;
          }
          
          .receipt-item-price {
            text-align: right;
            font-weight: normal;
          }
          
          .receipt-totals {
            margin-top: 8px;
          }
          
          .receipt-total-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 1px;
            font-size: 10px;
          }
          
          .receipt-total-final {
            font-weight: bold;
            font-size: 12px;
            margin-top: 4px;
            padding-top: 4px;
          }
          
          .receipt-footer {
            text-align: left;
            margin-top: 12px;
            font-size: 9px;
            line-height: 1.2;
          }
          
          .receipt-footer .center {
            text-align: center;
            margin-top: 8px;
          }
          
          .split-info {
            text-align: center;
            font-weight: bold;
            font-size: 10px;
            margin-bottom: 6px;
            padding: 2px 0;
            background: #f5f5f5;
          }
          
          .payment-details {
            margin-top: 6px;
            font-size: 9px;
          }
          
          .payment-method {
            display: flex;
            justify-content: space-between;
            margin-bottom: 1px;
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
      toast.success(`Receipt printed successfully!`);
    },
    onPrintError: (error) => {
      console.error('Print failed:', error);
      setIsPrinting(false);
      toast.error('Print failed. Please try again.');
    }
  });

  if (!order || !receiptData) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Icon name="receipt" className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              {receiptData.isSplit ? `Split Receipt ${receiptData.splitNumber}` : 'Receipt'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Icon name="close" className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Receipt Preview */}
        <div className="p-6 overflow-y-auto max-h-96">
          <div ref={printRef} className="receipt-container bg-white p-4 border border-gray-200 rounded-lg" style={{
            fontFamily: 'Courier New, monospace',
            fontSize: '11px',
            lineHeight: '1.1',
            maxWidth: '80mm',
            margin: '0 auto',
            background: 'white'
          }}>
            {/* Receipt Header */}
            <div className="receipt-header" style={{textAlign: 'center', marginBottom: '8px', paddingBottom: '8px'}}>
              <div className="receipt-title" style={{fontSize: '14px', fontWeight: 'bold', marginBottom: '2px', textTransform: 'uppercase'}}>
                {business.restaurantName || 'RESTAURANT NAME'}
              </div>
              <div className="receipt-subtitle" style={{fontSize: '10px', lineHeight: '1.2', marginBottom: '4px'}}>
                {business.address && <div>{business.address}</div>}
                {business.phone && <div>{business.phone}</div>}
              </div>
              {receiptType === 'draft' && (
                <div style={{textAlign: 'center', fontWeight: 'bold', color: '#666', marginTop: '4px'}}>
                  DRAFT RECEIPT
                </div>
              )}
            </div>

            {/* Dotted Line */}
            <div className="dotted-line" style={{borderTop: '1px dotted #000', margin: '4px 0', height: '1px'}}></div>

            {/* Split Payment Info */}
            {receiptData.isSplit && (
              <div className="split-info">
                SPLIT PAYMENT - Part {receiptData.splitNumber} of {receiptData.totalSplits}
              </div>
            )}

            {/* Receipt Info */}
            <div className="receipt-info" style={{marginBottom: '8px', fontSize: '10px'}}>
              <div className="receipt-total-line" style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1px', padding: '1px 0', fontSize: '10px'}}>
                <span>Receipt #:</span>
                <span>{receiptData.orderNumber}</span>
              </div>
              <div className="receipt-total-line" style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1px', padding: '1px 0', fontSize: '10px'}}>
                <span>Date:</span>
                <span>{receiptData.shortDate}</span>
              </div>
              <div className="receipt-total-line" style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1px', padding: '1px 0', fontSize: '10px'}}>
                <span>Time:</span>
                <span>{receiptData.time}</span>
              </div>
              <div className="receipt-total-line" style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1px', padding: '1px 0', fontSize: '10px'}}>
                <span>Table:</span>
                <span>{receiptData.tableName}</span>
              </div>
              <div className="receipt-total-line" style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1px', padding: '1px 0', fontSize: '10px'}}>
                <span>Cashier:</span>
                <span>{receiptData.cashierName}</span>
              </div>
            </div>

            {/* Dotted Line */}
            <div className="dotted-line" style={{borderTop: '1px dotted #000', margin: '4px 0', height: '1px'}}></div>

            {/* Receipt Items */}
            <div className="receipt-items" style={{marginBottom: '8px'}}>
              {order.orderItems?.map((item, index) => (
                <div key={index} className="receipt-item" style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1px', padding: '1px 0', fontSize: '10px'}}>
                  <div className="receipt-item-name" style={{flex: '1'}}>
                    {item.quantity}x {item.product.name}
                    {item.notes && (
                      <div style={{fontSize: '9px', color: '#666'}}>
                        Note: {item.notes}
                      </div>
                    )}
                  </div>
                  <div className="receipt-item-price" style={{textAlign: 'right', fontWeight: 'normal'}}>
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            {/* Dotted Line */}
            <div className="dotted-line" style={{borderTop: '1px dotted #000', margin: '4px 0', height: '1px'}}></div>

            {/* Receipt Totals */}
            <div className="receipt-totals" style={{marginTop: '8px'}}>
              {!receiptData.isSplit && (
                <>
                  <div className="receipt-total-line" style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1px', fontSize: '10px'}}>
                    <span>Sub Total</span>
                    <span>{formatCurrency(receiptData.subtotal)}</span>
                  </div>
                  {receiptData.tax > 0 && (
                    <div className="receipt-total-line" style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1px', fontSize: '10px'}}>
                      <span>VAT ({getOrderVATRate()}%)</span>
                      <span>{formatCurrency(receiptData.tax)}</span>
                    </div>
                  )}
                  {receiptData.discount > 0 && (
                    <div className="receipt-total-line" style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1px', fontSize: '10px'}}>
                      <span>Discount ({Math.round((parseFloat(receiptData.discount) / (order.orderItems.reduce((sum, item) => sum + parseFloat(item.subtotal), 0))) * 100)}%)</span>
                      <span>-{formatCurrency(receiptData.discount)}</span>
                    </div>
                  )}
                </>
              )}
              
              {receiptData.isSplit && (
                <div className="receipt-total-line" style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1px', fontSize: '10px'}}>
                  <span>Split Amount</span>
                  <span>{formatCurrency(receiptData.total)}</span>
                </div>
              )}
              
              {/* Dotted Line before total */}
              <div className="dotted-line" style={{borderTop: '1px dotted #000', margin: '4px 0', height: '1px'}}></div>
              
              <div className="receipt-total-final" style={{fontWeight: 'bold', fontSize: '12px', marginTop: '4px', paddingTop: '4px'}}>
                <div className="receipt-total-line" style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1px', fontSize: '12px', fontWeight: 'bold'}}>
                  <span>TOTAL</span>
                  <span>{formatCurrency(receiptData.total)}</span>
                </div>
              </div>
            </div>

            {/* Dotted Line */}
            <div className="dotted-line" style={{borderTop: '1px dotted #000', margin: '4px 0', height: '1px'}}></div>

            {/* Payment Details for Split */}
            {receiptData.isSplit && receiptData.splitPaymentMethods.length > 0 && (
              <div className="payment-details" style={{marginTop: '6px', fontSize: '9px'}}>
                {receiptData.splitPaymentMethods.map((method, index) => (
                  <div key={index} className="payment-method" style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1px'}}>
                    <span>{method.method}:</span>
                    <span>{formatCurrency(method.amount)} ({method.currency})</span>
                  </div>
                ))}
              </div>
            )}

            {/* Draft Payment Methods */}
            {receiptData.draftPaymentMethods && receiptData.draftPaymentMethods.length > 0 && (
              <div className="payment-details" style={{marginTop: '6px', fontSize: '9px'}}>
                <div style={{fontWeight: 'bold', marginBottom: '4px'}}>Payment Methods:</div>
                {receiptData.draftPaymentMethods.map((method, index) => (
                  <div key={index} className="payment-method" style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1px'}}>
                    <span>{method.method}:</span>
                    <span>{formatCurrency(method.amount)} ({method.currency})</span>
                  </div>
                ))}
              </div>
            )}

            {/* Receipt Footer */}
            <div className="receipt-footer" style={{textAlign: 'left', marginTop: '12px', fontSize: '9px', lineHeight: '1.2'}}>
              <div>{receiptData.shortDate} {receiptData.time}</div>
              <div>Transaction ID: {receiptData.orderNumber}</div>
              {receiptData.isSplit && (
                <div>Split Payment: {receiptData.splitNumber} of {receiptData.totalSplits}</div>
              )}
              {receiptType === 'draft' && (
                <div style={{color: '#666', fontStyle: 'italic'}}>
                  This is a draft receipt - payment not yet processed
                </div>
              )}
              <div style={{textAlign: 'center', marginTop: '8px'}}>
                Thank You For Supporting
              </div>
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
            <span>{isPrinting ? 'Printing...' : 'Print Receipt'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleReceiptModal;
