import React, { useRef, useState, useMemo } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useSettings } from '../../contexts/SettingsContext';
import Icon from '../common/Icon';
import logo from '../../assets/logo.png';

const InvoiceModal = ({ order, onClose }) => {
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

  // Optimized memoized calculations
  const invoiceData = useMemo(() => {
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
    <div className="bg-gradient-to-r from-primary-50 to-primary-100 p-6 border-b border-primary-200 invoice-header" style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexDirection: 'row',
      pageBreakInside: 'avoid',
      breakInside: 'avoid'
    }}>
      {/* Business Information - Left Side */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div className="w-16 h-16 bg-white rounded-xl shadow-md flex items-center justify-center flex-shrink-0">
          <img src={logo} alt="Logo" className="w-12 h-12 object-contain" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-primary-900" style={{ margin: 0, fontSize: '18px' }}>{business.restaurantName || 'Restaurant POS'}</h3>
          <p className="text-primary-700 text-sm" style={{ margin: '2px 0', fontSize: '12px' }}>{business.address || '123 Main Street, City, State 12345'}</p>
          <p className="text-primary-700 text-sm" style={{ margin: '2px 0', fontSize: '12px' }}>{business.phone || '+1 (555) 123-4567'}</p>
        </div>
      </div>
      
      {/* Invoice Details - Right Side */}
      <div style={{
        textAlign: 'right',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end'
      }}>
        <h2 className="text-3xl font-bold text-primary-900" style={{ margin: '0 0 8px 0', fontSize: '24px' }}>INVOICE</h2>
        <p className="text-primary-700 font-semibold text-lg" style={{ margin: '2px 0', fontSize: '14px' }}>#{order.orderNumber}</p>
        <p className="text-primary-600 text-sm" style={{ margin: '2px 0', fontSize: '12px' }}>{invoiceData.shortDate}, {invoiceData.time}</p>
      </div>
    </div>
  );

  // Optimized print handler with multi-page header support
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Invoice-${order.orderNumber}`,
    onBeforeGetContent: () => {
      console.log('Print: Before get content');
      setIsPrinting(true);
      
      // Add print-specific styles for multi-page support
      const style = document.createElement('style');
      style.textContent = `
        @media print {
          @page {
            margin: 0.5in;
          }
          
          .invoice-header {
            page-break-inside: avoid;
            break-inside: avoid;
            margin-bottom: 20px;
          }
          
          .order-items-container {
            page-break-inside: auto;
          }
          
          .order-item {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          /* Force page breaks after every 15 items */
          .order-item:nth-child(15n) {
            page-break-after: always;
          }
          
          /* Add header before page breaks */
          .order-item:nth-child(15n)::after {
            content: "";
            display: block;
            page-break-after: always;
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


  if (!order || !invoiceData) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="alert" className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Invoice Data</h3>
            <p className="text-gray-600 mb-6">Unable to load invoice information.</p>
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
            .print\\:max-h-none { max-height: none !important; }
            .print\\:overflow-visible { overflow: visible !important; }
            .print\\:shadow-none { box-shadow: none !important; }
            .print\\:border-0 { border: none !important; }
            .print\\:bg-white { background: white !important; }
            .print\\:text-black { color: black !important; }
            .order-items-container { max-height: none !important; overflow: visible !important; }
            .invoice-container { max-height: none !important; overflow: visible !important; }
            
            /* Show print-only headers in print */
            .print-only {
              display: block !important;
            }
            
            .invoice-header {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            .order-items-container {
              page-break-inside: auto;
            }
            
            .order-item {
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
            <div className="relative mx-auto w-full max-w-6xl bg-white rounded-2xl shadow-2xl min-h-[95vh] max-h-[98vh] overflow-y-auto print:max-h-none print:overflow-visible print:shadow-none">
        {/* Optimized Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3 sm:gap-4 mb-4 lg:mb-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
              <Icon name="receipt" className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                Invoice #{order.orderNumber}
              </h2>
              <p className="text-gray-600 text-sm sm:text-base">{invoiceData.formattedDate}</p>
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
              aria-label="Close invoice"
            >
              <Icon name="close" className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="p-4 sm:p-6">
          <div ref={printRef} className="bg-white border border-gray-200 rounded-xl overflow-hidden flex-shrink-0 print:shadow-none print:border-0 print:bg-white print:text-black print:overflow-visible print:max-h-none invoice-container">
            {/* Invoice Header */}
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 p-6 border-b border-primary-200 invoice-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexDirection: 'row'
            }}>
              {/* Business Information - Left Side */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div className="w-16 h-16 bg-white rounded-xl shadow-md flex items-center justify-center flex-shrink-0">
                  <img src={logo} alt="Logo" className="w-12 h-12 object-contain" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-primary-900" style={{ margin: 0, fontSize: '18px' }}>{business.restaurantName || 'Restaurant POS'}</h3>
                  <p className="text-primary-700 text-sm" style={{ margin: '2px 0', fontSize: '12px' }}>{business.address || '123 Main Street, City, State 12345'}</p>
                  <p className="text-primary-700 text-sm" style={{ margin: '2px 0', fontSize: '12px' }}>{business.phone || '+1 (555) 123-4567'}</p>
                </div>
              </div>
              
              {/* Invoice Details - Right Side */}
              <div style={{
                textAlign: 'right',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end'
              }}>
                <h2 className="text-3xl font-bold text-primary-900" style={{ margin: '0 0 8px 0', fontSize: '24px' }}>INVOICE</h2>
                <p className="text-primary-700 font-semibold text-lg" style={{ margin: '2px 0', fontSize: '14px' }}>#{order.orderNumber}</p>
                <p className="text-primary-600 text-sm" style={{ margin: '2px 0', fontSize: '12px' }}>{invoiceData.shortDate}, {invoiceData.time}</p>
              </div>
            </div>


            {/* Order Items */}
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Icon name="box" className="w-4 h-4 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Order Items</h3>
              </div>

                      <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar print:max-h-none print:overflow-visible order-items-container">
                {(() => {
                  const items = order.orderItems || [];
                  const itemsPerPage = 15;
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
                            <div className="flex items-center gap-3 mb-4 mt-6">
                              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                <Icon name="box" className="w-4 h-4 text-orange-600" />
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900">Order Items (continued)</h3>
                            </div>
                          </div>
                        )}
                        
                        {/* Render items for this page */}
                        {pageItems.map((item, pageIndex) => {
                          const globalIndex = i + pageIndex;
                          return (
                            <div key={item.id || globalIndex} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg order-item">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-500">#{globalIndex + 1}</span>
                                <span className="font-medium text-gray-900">{item.product?.name || 'Unknown Product'}</span>
                                <span className="text-sm text-gray-500">x{item.quantity}</span>
                              </div>
                              <span className="font-bold text-primary-600">{formatCurrency(item.subtotal)}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }
                  
                  return pages.length > 0 ? pages : <p className="text-gray-500 text-center py-4">No items found</p>;
                })()}
              </div>
                    </div>

            {/* Financial Summary */}
            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Icon name="clipboard" className="w-4 h-4 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Order Summary</h3>
              </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(invoiceData.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">VAT ({getOrderVATRate()}%):</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(invoiceData.tax)}</span>
                  </div>
                  {invoiceData.discount > 0 && (
                    <div className="flex justify-between items-center">
                    <span className="text-gray-600">Discount ({Math.round((parseFloat(invoiceData.discount) / (order.orderItems.reduce((sum, item) => sum + parseFloat(item.subtotal), 0))) * 100)}%):</span>
                    <span className="font-semibold text-red-600">-{formatCurrency(invoiceData.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-lg font-bold border-t border-gray-300 pt-3">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-primary-600">{formatCurrency(invoiceData.total)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-gradient-to-r from-primary-50 to-primary-100 text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                  <Icon name="heart" className="w-4 h-4 text-white" />
                </div>
              </div>
              <p className="text-lg font-semibold text-primary-900 mb-2">Thank you for your business!</p>
              <p className="text-primary-700 mb-2">Please visit us again</p>
              <p className="text-xs text-primary-600 mt-4">
                This is a computer-generated invoice. No signature required.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default InvoiceModal; 