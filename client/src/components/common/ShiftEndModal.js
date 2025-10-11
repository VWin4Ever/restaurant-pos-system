import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import Icon from './Icon';

const ShiftEndModal = ({ isOpen, onClose, onConfirm, shiftInfo, userId }) => {
  const [loading, setLoading] = useState(false);
  const [salesSummary, setSalesSummary] = useState(null);
  const [closingBalance, setClosingBalance] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen && userId) {
      fetchSalesSummary();
    }
  }, [isOpen, userId]);

  const fetchSalesSummary = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/shift-logs/sales-summary/${userId}`);
      setSalesSummary(response.data.data);
    } catch (error) {
      console.error('Error fetching sales summary:', error);
      toast.error('Failed to load sales summary');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!salesSummary) return;
    
    onConfirm({
      closingBalance: closingBalance ? parseFloat(closingBalance) : null,
      notes: notes.trim() || null
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Icon name="clock" size="lg" className="text-orange-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">End Shift Confirmation</h3>
              <p className="text-sm text-gray-600">
                {shiftInfo?.name} - {shiftInfo?.startTime} to {shiftInfo?.endTime}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Icon name="close" size="lg" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="loading-spinner"></div>
              <span className="ml-3 text-gray-600">Loading sales summary...</span>
            </div>
          ) : salesSummary ? (
            <>
              {/* Sales Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Icon name="chart" size="sm" className="mr-2 text-blue-600" />
                  Shift Sales Summary
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column - Key Metrics */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Orders:</span>
                      <span className="font-semibold text-gray-900">{salesSummary.totalOrders}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Revenue:</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(salesSummary.totalRevenue)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Cash Sales:</span>
                      <span className="font-semibold text-blue-600">
                        {formatCurrency(salesSummary.cashSales)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Card Sales:</span>
                      <span className="font-semibold text-purple-600">
                        {formatCurrency(salesSummary.cardSales)}
                      </span>
                    </div>
                  </div>

                  {/* Right Column - Timing & Balance */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Shift Started:</span>
                      <span className="font-semibold text-gray-900">
                        {formatTime(salesSummary.shiftStart)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-semibold text-gray-900">
                        {salesSummary.duration} minutes
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Opening Balance:</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(salesSummary.openingBalance)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Expected Balance:</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(salesSummary.expectedBalance)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cash Difference Warning */}
                {salesSummary.openingBalance && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center">
                      <Icon name="alert" size="sm" className="text-yellow-600 mr-2" />
                      <span className="text-sm text-yellow-800">
                        Please count your cash drawer and enter the closing balance below.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Closing Balance Input */}
              {salesSummary.openingBalance && (
                <div className="space-y-2">
                  <label htmlFor="closingBalance" className="block text-sm font-medium text-gray-700">
                    Closing Cash Balance
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      id="closingBalance"
                      value={closingBalance}
                      onChange={(e) => setClosingBalance(e.target.value)}
                      step="0.01"
                      min="0"
                      className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="0.00"
                    />
                  </div>
                  {closingBalance && salesSummary.expectedBalance && (
                    <div className="text-sm">
                      <span className="text-gray-600">Difference: </span>
                      <span className={`font-semibold ${
                        parseFloat(closingBalance) === salesSummary.expectedBalance
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {formatCurrency(parseFloat(closingBalance) - salesSummary.expectedBalance)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  End of Shift Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Any notes about the shift..."
                />
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Icon name="alert" size="xl" className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Unable to load sales summary</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !salesSummary}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon name="logout" size="sm" className="mr-2" />
            End Shift
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShiftEndModal;

