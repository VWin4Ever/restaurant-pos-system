import React, { useRef, useState, useCallback, useMemo } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useSettings } from '../../contexts/SettingsContext';
import Icon from '../common/Icon';
import logo from '../../assets/logo.png';
import { toast } from 'react-toastify';

const InvoiceModal = ({ order, onClose }) => {
  const printRef = useRef();
  const { settings, formatCurrency } = useSettings();
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [activeTab, setActiveTab] = useState('preview'); // preview, print, share
  
  // Use business snapshot from order if available, otherwise use current settings
  const businessSnapshot = order.businessSnapshot || {};
  const currentBusiness = settings.business || {};
  const business = businessSnapshot.restaurantName ? businessSnapshot : currentBusiness;

  // Memoized calculations for better performance
  const invoiceData = useMemo(() => {
    const subtotal = parseFloat(order.subtotal) || 0;
    const discount = parseFloat(order.discount) || 0;
    const total = parseFloat(order.total) || 0;
    
    return {
      subtotal,
      discount,
      total,
      itemCount: order.orderItems?.length || 0,
      formattedDate: new Date(order.createdAt).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  }, [order]);

  // Optimized print handler
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Invoice-${order.orderNumber}`,
    onBeforeGetContent: () => setIsPrinting(true),
    onAfterPrint: () => {
      setIsPrinting(false);
      toast.success('Invoice printed successfully');
    },
    onPrintError: (error) => {
      setIsPrinting(false);
      console.error('Print failed:', error);
      toast.error('Print failed. Please try again.');
    }
  });

  // PDF Download functionality with lazy loading
  const handleDownloadPDF = useCallback(async () => {
    setIsDownloading(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { default: jsPDF } = await import('jspdf');
      
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Invoice-${order.orderNumber}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast.error('PDF generation failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  }, [order.orderNumber]);

  // Email sharing functionality
  const handleShareEmail = useCallback(async () => {
    setIsSharing(true);
    try {
      const subject = `Invoice #${order.orderNumber} - ${business.restaurantName || 'Restaurant'}`;
      const body = `Please find attached the invoice for order #${order.orderNumber}.\n\nTotal Amount: ${formatCurrency(invoiceData.total)}\nDate: ${invoiceData.formattedDate}`;
      
      const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoLink, '_blank');
      toast.success('Email client opened');
    } catch (error) {
      console.error('Email sharing failed:', error);
      toast.error('Failed to open email client');
    } finally {
      setIsSharing(false);
    }
  }, [order.orderNumber, business.restaurantName, invoiceData.total, invoiceData.formattedDate, formatCurrency]);

  // Copy link functionality
  const handleCopyLink = useCallback(async () => {
    try {
      const invoiceUrl = `${window.location.origin}/invoice/${order.id}`;
      await navigator.clipboard.writeText(invoiceUrl);
      toast.success('Invoice link copied to clipboard');
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error('Failed to copy link');
    }
  }, [order.id]);

  // Format date helper
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge configuration
  const getStatusBadge = (status) => {
    const configs = {
      'PENDING': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: 'clock' },
      'COMPLETED': { color: 'bg-green-100 text-green-800 border-green-200', icon: 'check' },
      'CANCELLED': { color: 'bg-red-100 text-red-800 border-red-200', icon: 'close' }
    };
    
    const config = configs[status] || configs['PENDING'];
    const displayStatus = status.charAt(0) + status.slice(1).toLowerCase();
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
        <Icon name={config.icon} className="w-4 h-4" />
        {displayStatus}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 p-4">
      <div className="relative mx-auto w-full max-w-6xl bg-white rounded-2xl shadow-2xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-4 mb-4 sm:mb-0">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
              <Icon name="receipt" className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Invoice #{order.orderNumber}
              </h2>
              <p className="text-gray-600 text-sm sm:text-base">{invoiceData.formattedDate}</p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Icon name="print" className="w-4 h-4" />
              {isPrinting ? 'Printing...' : 'Print'}
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Icon name="download" className="w-4 h-4" />
              {isDownloading ? 'Generating...' : 'PDF'}
            </button>
            <button
              onClick={handleShareEmail}
              disabled={isSharing}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Icon name="email" className="w-4 h-4" />
              {isSharing ? 'Opening...' : 'Email'}
            </button>
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center w-10 h-10 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <Icon name="close" className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-6 bg-gray-50">
          <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">Total</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900">{formatCurrency(invoiceData.total)}</p>
              </div>
              <Icon name="money" className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
            </div>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">Items</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900">{invoiceData.itemCount}</p>
              </div>
              <Icon name="products" className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">Table</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900">{order.table?.number || 'N/A'}</p>
              </div>
              <Icon name="tables" className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">Status</p>
                <div className="mt-1">{getStatusBadge(order.status)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div ref={printRef} className="bg-white rounded-xl border border-gray-200 shadow-sm">
            {/* Invoice Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={logo}
                    alt="Logo"
                    className="w-16 h-16 rounded-xl shadow-md"
                    style={{ background: 'white' }}
                  />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {business.restaurantName || 'Restaurant Name'}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {business.address || 'Restaurant Address'}
                    </p>
                    <p className="text-gray-600 text-sm">
                      {business.phone || 'Phone Number'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <h4 className="text-lg font-bold text-gray-900">INVOICE</h4>
                  <p className="text-gray-600 text-sm">#{order.orderNumber}</p>
                  <p className="text-gray-600 text-sm">{formatDate(order.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Table Information</h5>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Icon name="tables" className="w-4 h-4" />
                    <span>Table {order.table?.number || 'N/A'}</span>
                  </div>
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Cashier</h5>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Icon name="user" className="w-4 h-4" />
                    <span>{order.user?.name || 'System Administrator'}</span>
                  </div>
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Date & Time</h5>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Icon name="calendar" className="w-4 h-4" />
                    <span>{formatDate(order.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm mb-6">
                <h5 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Icon name="products" className="w-5 h-5 text-primary-600" />
                  Order Items
                </h5>
                <div className="space-y-2">
                  {order.orderItems?.map((item, index) => (
                    <div key={item.id || index} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0">
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">#{index + 1} {item.product?.name || 'Product'}</span>
                        <span className="text-gray-600 ml-2">x{item.quantity}</span>
                      </div>
                      <span className="font-semibold text-primary-600">{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <h5 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Icon name="calculator" className="w-5 h-5 text-primary-600" />
                  Order Summary
                </h5>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Subtotal:</span>
                    <span className="font-bold text-gray-900">{formatCurrency(invoiceData.subtotal)}</span>
                  </div>
                  {invoiceData.discount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Discount:</span>
                      <span className="font-medium text-red-600">-{formatCurrency(invoiceData.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center bg-primary-50 rounded-lg p-3 border border-primary-200">
                    <span className="text-gray-900 font-bold">Total:</span>
                    <span className="text-primary-600 font-bold text-lg">{formatCurrency(invoiceData.total)}</span>
                  </div>
                </div>
              </div>

              {/* Customer Note */}
              {order.customerNote && (
                <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Icon name="info" className="w-4 h-4 text-yellow-600" />
                    Customer Note
                  </h5>
                  <p className="text-gray-700">{order.customerNote}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-200 text-center">
              <div className="mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Icon name="heart" className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-lg font-semibold text-gray-900 mb-2">Thank you for your business!</p>
              <p className="text-gray-600 mb-2">Please visit us again</p>
              <p className="text-xs text-gray-500 mt-4">
                This is a computer-generated invoice. No signature required.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal; 