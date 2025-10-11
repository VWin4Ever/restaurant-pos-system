import React, { useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import Icon from '../common/Icon';
import SimpleReceiptModal from './SimpleReceiptModal';

const SplitReceiptManager = ({ order, onClose, paymentData = null, receiptType = 'final' }) => {
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedSplitIndex, setSelectedSplitIndex] = useState(null);
  const [printAllMode, setPrintAllMode] = useState(false);

  // Parse split amounts from order or payment data
  const splitAmounts = useMemo(() => {
    // If we have payment data (draft receipt), use that
    if (paymentData && paymentData.splitPaymentPanels) {
      return paymentData.splitPaymentPanels.map((panel, index) => ({
        amount: panel.amount,
        id: panel.id,
        currency: panel.currency,
        method: panel.method,
        paymentMethods: [{ method: panel.method, amount: panel.amount, currency: panel.currency, id: panel.id }]
      }));
    }
    
    // Otherwise, use order data
    if (!order || !order.splitBill || !order.splitAmounts) {
      return [];
    }
    try {
      return JSON.parse(order.splitAmounts);
    } catch (error) {
      console.error('Error parsing split amounts:', error);
      return [];
    }
  }, [order, paymentData]);

  // Handle individual split receipt
  const handleSplitReceipt = (splitIndex) => {
    setSelectedSplitIndex(splitIndex);
    setShowReceiptModal(true);
  };

  // Handle printing all split receipts
  const handlePrintAllSplits = async () => {
    if (splitAmounts.length === 0) {
      toast.warning('No split amounts found for this order');
      return;
    }

    setPrintAllMode(true);
    toast.info(`Printing ${splitAmounts.length} split receipts...`);
    
    // Simulate printing all splits
    for (let i = 0; i < splitAmounts.length; i++) {
      // In a real implementation, this would trigger actual printing
      console.log(`Printing split ${i + 1} of ${splitAmounts.length}`);
      // Add a small delay between prints
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setPrintAllMode(false);
    toast.success(`All ${splitAmounts.length} split receipts printed successfully!`);
  };

  // Handle full receipt (non-split)
  const handleFullReceipt = () => {
    setSelectedSplitIndex(null);
    setShowReceiptModal(true);
  };

  if (!order) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Icon name="receipt" className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">Receipt Options</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Icon name="close" className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Order Info */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-600">Order #:</span>
              <span className="ml-2 font-semibold">{order.orderNumber}</span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Table:</span>
              <span className="ml-2 font-semibold">{order.table?.number ? `Table ${order.table.number}` : 'N/A'}</span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Total:</span>
              <span className="ml-2 font-semibold">${parseFloat(order.total).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Receipt Options */}
        <div className="p-6">
          {(order.splitBill || (paymentData && paymentData.splitPaymentPanels)) && splitAmounts.length > 0 ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {receiptType === 'draft' ? 'Draft Split Payment Receipts' : 'Split Payment Receipts'}
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                {receiptType === 'draft' 
                  ? `This order will have ${splitAmounts.length} split payment(s). You can print individual draft split receipts or all at once.`
                  : `This order has ${splitAmounts.length} split payment(s). You can print individual split receipts or all at once.`
                }
              </p>
              
              {/* Individual Split Receipts */}
              <div className="space-y-3 mb-6">
                {splitAmounts.map((split, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">Split {index + 1}</h4>
                        <div className="text-sm text-gray-600 mt-1">
                          <div>Amount: ${parseFloat(split.amount).toFixed(2)}</div>
                          {split.paymentMethods && split.paymentMethods.length > 0 && (
                            <div className="mt-1">
                              <span className="font-medium">Payment Methods:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {split.paymentMethods.map((method, methodIndex) => (
                                  <span
                                    key={methodIndex}
                                    className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                                  >
                                    {method.method}: ${method.amount} ({method.currency})
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleSplitReceipt(index)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                      >
                        <Icon name="print" className="w-4 h-4" />
                        <span>{receiptType === 'draft' ? 'Print Draft Receipt' : 'Print Receipt'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bulk Actions */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-gray-900 mb-4">Bulk Actions</h4>
                <div className="flex space-x-3">
                  <button
                    onClick={handlePrintAllSplits}
                    disabled={printAllMode}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    {printAllMode ? (
                      <>
                        <Icon name="loading" className="w-4 h-4 animate-spin" />
                        <span>Printing All...</span>
                      </>
                    ) : (
                      <>
                        <Icon name="print" className="w-4 h-4" />
                        <span>{receiptType === 'draft' ? 'Print All Draft Splits' : 'Print All Splits'}</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={handleFullReceipt}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                  >
                    <Icon name="receipt" className="w-4 h-4" />
                    <span>Full Receipt</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Full Payment Receipt</h3>
              <p className="text-sm text-gray-600 mb-6">
                This order has a single payment. You can print the receipt.
              </p>
              
              <div className="flex justify-center">
                <button
                  onClick={handleFullReceipt}
                  className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-3 text-lg"
                >
                  <Icon name="print" className="w-6 h-6" />
                  <span>Print Receipt</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Simple Receipt Modal */}
      {showReceiptModal && (
        <SimpleReceiptModal
          order={order}
          splitIndex={selectedSplitIndex}
          receiptType={receiptType}
          paymentData={paymentData}
          onClose={() => {
            setShowReceiptModal(false);
            setSelectedSplitIndex(null);
          }}
        />
      )}
    </div>
  );
};

export default SplitReceiptManager;
