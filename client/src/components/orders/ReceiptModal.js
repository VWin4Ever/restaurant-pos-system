import React, { useRef, useState, useMemo } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useSettings } from '../../contexts/SettingsContext';
import Icon from '../common/Icon';

const ReceiptModal = ({ order, onClose }) => {
  const printRef = useRef();
  const { settings, formatCurrency } = useSettings();
  const [isPrinting, setIsPrinting] = useState(false);
  
  // Use business snapshot from order if available, otherwise use current settings
  const businessSnapshot = order.businessSnapshot || {};
  const currentBusiness = settings.business || {};
  const business = businessSnapshot.restaurantName ? businessSnapshot : currentBusiness;

  // Optimized memoized calculations
  const receiptData = useMemo(() => {
    if (!order) return null;
    
    const subtotal = parseFloat(order.subtotal) || 0;
    const tax = parseFloat(order.tax) || 0;
    const discount = parseFloat(order.discount) || 0;
    const total = parseFloat(order.total) || 0;
    
    return {
      subtotal,
      tax,
      discount,
      total,
      itemCount: order.orderItems?.length || 0,
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
      })
    };
  }, [order]);

  // Function to render header for print
  const renderPrintHeader = () => (
    <div className="receipt-header" style={{
      textAlign: 'center',
      fontFamily: 'monospace',
      fontSize: '12px',
      lineHeight: '1.2',
      padding: '8px 0',
      pageBreakInside: 'avoid',
      breakInside: 'avoid'
    }}>
      <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
        {business.restaurantName || 'RESTAURANT POS'}
      </div>
      <div style={{ marginBottom: '2px' }}>
        {business.address || '1234 Main Street'}
      </div>
      <div style={{ marginBottom: '2px' }}>
        {business.address2 || 'Suite 567'}
      </div>
      <div style={{ marginBottom: '4px' }}>
        {business.city || 'City Name'}, {business.state || 'State'} {business.zip || '54321'}
      </div>
      <div style={{ marginBottom: '8px' }}>
        {business.phone || '123-456-7890'}
      </div>
      <div style={{ borderTop: '1px dotted #000', margin: '8px 0' }}></div>
    </div>
  );

  // Optimized print handler with multi-page header support
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Receipt-${order.orderNumber}`,
    onBeforeGetContent: () => {
      console.log('Print: Before get content');
      setIsPrinting(true);
      
      // Add print-specific styles for multi-page support
      const style = document.createElement('style');
      style.textContent = `
        @media print {
          @page {
            margin: 0.3in;
            size: 80mm 297mm;
          }
          
          .receipt-header {
            page-break-inside: avoid;
            break-inside: avoid;
            margin-bottom: 10px;
          }
          
          .receipt-items-container {
            page-break-inside: auto;
          }
          
          .receipt-item {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          .print-page-break-before {
            page-break-before: always;
          }
        }
      `;
      document.head.appendChild(style);
      
      // Clean up after printing
      setTimeout(() => {
        if (document.head.contains(style)) {
          document.head.removeChild(style);
        }
      }, 1000);
    },
    onAfterPrint: () => {
      console.log('Print: After print');
      setIsPrinting(false);
    },
    onPrintError: (error) => {
      console.error('Print failed:', error);
      setIsPrinting(false);
    }
  });

  if (!order || !receiptData) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="alert" className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Receipt Data</h3>
            <p className="text-gray-600 mb-6">Unable to load receipt information.</p>
            <button onClick={onClose} className="btn-primary">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          @media print {
            @page {
              margin: 0.2in;
              size: 80mm 297mm;
            }
            
            .print\\:max-h-none { max-height: none !important; }
            .print\\:overflow-visible { overflow: visible !important; }
            .print\\:shadow-none { box-shadow: none !important; }
            .print\\:border-0 { border: none !important; }
            .print\\:bg-white { background: white !important; }
            .print\\:text-black { color: black !important; }
            .receipt-items-container { max-height: none !important; overflow: visible !important; }
            .receipt-container { 
              max-height: none !important; 
              overflow: visible !important;
              font-family: monospace !important;
              font-size: 12px !important;
              line-height: 1.2 !important;
              max-width: 80mm !important;
              margin: 0 auto !important;
            }
            
            /* Show print-only headers in print */
            .print-only {
              display: block !important;
            }
            
            .receipt-header {
              page-break-inside: avoid;
              break-inside: avoid;
              text-align: center !important;
              font-family: monospace !important;
              font-size: 12px !important;
              line-height: 1.2 !important;
            }
            
            .receipt-items-container {
              page-break-inside: auto;
            }
            
            .receipt-item {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            .print-page-break-before {
              page-break-before: always;
            }
          }
          
          /* Hide print-only headers on screen */
          .print-only {
            display: none;
          }
        `}
      </style>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 p-2 sm:p-4">
        <div className="relative mx-auto w-full max-w-4xl bg-white rounded-2xl shadow-2xl min-h-[95vh] max-h-[98vh] overflow-y-auto print:max-h-none print:overflow-visible print:shadow-none">
          {/* Optimized Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-3 sm:gap-4 mb-4 lg:mb-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                <Icon name="receipt" className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                  Receipt #{order.orderNumber}
                </h2>
                <p className="text-gray-600 text-sm sm:text-base">{receiptData.formattedDate}</p>
              </div>
            </div>
            
            {/* Optimized Action Buttons */}
            <div className="flex flex-wrap gap-2 sm:gap-3 w-full lg:w-auto">
              <button
                onClick={() => {
                  console.log('Print button clicked');
                  console.log('PrintRef current:', printRef.current);
                  try {
                    handlePrint();
                  } catch (error) {
                    console.error('Print error:', error);
                    // Fallback to window.print() if react-to-print fails
                    window.print();
                  }
                }}
                disabled={isPrinting}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm flex-1 sm:flex-none"
              >
                <Icon name="print" className="w-4 h-4" />
                {isPrinting ? 'Printing...' : 'Print'}
              </button>
              <button
                onClick={onClose}
                className="inline-flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors duration-200"
                aria-label="Close receipt"
              >
                <Icon name="close" className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Receipt Content */}
          <div className="p-4 sm:p-6">
            <div ref={printRef} className="bg-white border border-gray-200 rounded-xl overflow-hidden flex-shrink-0 print:shadow-none print:border-0 print:bg-white print:text-black print:overflow-visible print:max-h-none receipt-container" style={{
              fontFamily: 'monospace',
              fontSize: '12px',
              lineHeight: '1.2',
              maxWidth: '80mm',
              margin: '0 auto'
            }}>
              {/* Receipt Header */}
              {renderPrintHeader()}

              {/* Order Items */}
              <div style={{ padding: '0 8px' }}>
                {(() => {
                  const items = order.orderItems || [];
                  const itemsPerPage = 20;
                  const pages = [];
                  
                  for (let i = 0; i < items.length; i += itemsPerPage) {
                    const pageItems = items.slice(i, i + itemsPerPage);
                    const isFirstPage = i === 0;
                    
                    pages.push(
                      <div key={`page-${Math.floor(i / itemsPerPage)}`} className={isFirstPage ? '' : 'print-page-break-before'}>
                        {/* Add header for non-first pages */}
                        {!isFirstPage && (
                          <div className="print-only">
                            {renderPrintHeader()}
                          </div>
                        )}
                        
                        {/* Render items for this page */}
                        {pageItems.map((item, pageIndex) => {
                          const globalIndex = i + pageIndex;
                          return (
                            <div key={item.id || globalIndex} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              marginBottom: '2px',
                              padding: '1px 0'
                            }}>
                              <div style={{ flex: '1', textAlign: 'left' }}>
                                {item.product?.name || 'Unknown Product'}
                              </div>
                              <div style={{ textAlign: 'right', minWidth: '60px' }}>
                                {formatCurrency(item.subtotal)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }
                  
                  return pages.length > 0 ? pages : <div style={{ textAlign: 'center', padding: '20px 0' }}>No items found</div>;
                })()}
              </div>

              {/* Separator */}
              <div style={{ borderTop: '1px dotted #000', margin: '8px 0' }}></div>

              {/* Financial Summary */}
              <div style={{ padding: '0 8px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '2px'
                }}>
                  <span>Sub Total</span>
                  <span>{formatCurrency(receiptData.subtotal)}</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '2px'
                }}>
                  <span>Sales Tax</span>
                  <span>{formatCurrency(receiptData.tax)}</span>
                </div>
                {receiptData.discount > 0 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '2px'
                  }}>
                    <span>Discount</span>
                    <span>-{formatCurrency(receiptData.discount)}</span>
                  </div>
                )}
              </div>

              {/* Separator */}
              <div style={{ borderTop: '1px dotted #000', margin: '8px 0' }}></div>

              {/* Total */}
              <div style={{ padding: '0 8px', marginBottom: '8px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}>
                  <span>TOTAL</span>
                  <span>{formatCurrency(receiptData.total)}</span>
                </div>
              </div>

              {/* Separator */}
              <div style={{ borderTop: '1px dotted #000', margin: '8px 0' }}></div>

              {/* Footer */}
              <div style={{ padding: '0 8px', textAlign: 'center', marginBottom: '8px' }}>
                <div style={{ marginBottom: '4px' }}>
                  {receiptData.shortDate} {receiptData.time}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  Transaction ID: {order.orderNumber}
                </div>
                <div style={{ fontWeight: 'bold' }}>
                  Thank You For Supporting
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReceiptModal;
