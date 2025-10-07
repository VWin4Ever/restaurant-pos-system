import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Icon from '../common/Icon';

const PaymentPage = ({ order, onClose, onPaymentSuccess }) => {
  const [processing, setProcessing] = useState(false);
  const [paymentType, setPaymentType] = useState('full'); // 'full' or 'split'
  const [paymentPanels, setPaymentPanels] = useState([
    { id: 1, currency: 'USD', method: 'CASH', amount: '' }
  ]);

  // Currency conversion rates (hardcoded)
  const exchangeRates = {
    USD: 1,
    Riel: 4100 // 1 USD = 4100 Riel
  };

  const totalAmount = order ? parseFloat(order.total) : 0;

  // Initialize payment panels based on type
  useEffect(() => {
    if (paymentType === 'full') {
      setPaymentPanels([{ id: 1, currency: 'USD', method: 'CASH', amount: totalAmount.toString() }]);
    } else if (paymentType === 'split') {
      setPaymentPanels([
        { id: 1, currency: 'USD', method: 'CASH', amount: '' },
        { id: 2, currency: 'USD', method: 'CASH', amount: '' }
      ]);
    }
  }, [paymentType, totalAmount]);

  // Handle panel changes
  const handlePanelChange = (id, field, value) => {
    setPaymentPanels(prev => 
      prev.map(panel => 
        panel.id === id ? { ...panel, [field]: value } : panel
      )
    );
  };

  // Add new payment panel
  const addPaymentPanel = () => {
    const newId = Math.max(...paymentPanels.map(p => p.id), 0) + 1;
    setPaymentPanels(prev => [...prev, { 
      id: newId, 
      currency: 'USD', 
      method: 'CASH', 
      amount: '' 
    }]);
  };

  // Remove payment panel
  const removePaymentPanel = (id) => {
    if (paymentPanels.length > 1) {
      setPaymentPanels(prev => prev.filter(panel => panel.id !== id));
    }
  };

  // Calculate total in USD
  const getTotalInUSD = () => {
    return paymentPanels.reduce((sum, panel) => {
      const amount = parseFloat(panel.amount) || 0;
      if (panel.currency === 'USD') {
        return sum + amount;
      } else if (panel.currency === 'Riel') {
        return sum + (amount / exchangeRates.Riel);
      }
      return sum;
    }, 0);
  };

  // Get remaining amount
  const getRemaining = () => {
    return totalAmount - getTotalInUSD();
  };

  // Format currency amount
  const formatAmount = (amount, currency) => {
    if (currency === 'USD') {
      return `$${amount.toFixed(2)}`;
    } else if (currency === 'Riel') {
      return `${amount.toLocaleString()} Riel`;
    }
    return amount.toString();
  };

  // Process payment
  const handlePayment = async () => {
    if (!order) return;

    // Validate payments
    const totalInUSD = getTotalInUSD();
    if (Math.abs(totalInUSD - totalAmount) > 0.01) {
      toast.error('Payment amounts must equal the total amount');
      return;
    }

    setProcessing(true);
    try {
      const paymentData = {
        currency: 'USD',
        splitBill: paymentType === 'split',
        splitAmounts: paymentType === 'split' ? paymentPanels : [],
        mixedPayments: paymentType === 'full' && paymentPanels.length > 1,
        paymentMethods: paymentType === 'full' ? paymentPanels : [{ method: 'CASH', amount: totalAmount.toString(), id: 1 }],
        mixedCurrency: paymentPanels.some(p => p.currency === 'Riel'),
        nestedPayments: false,
        splitMixedCurrency: false
      };

      await axios.patch(`/api/orders/${order.id}/pay`, paymentData);
      
      toast.success('Payment processed successfully!');
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
      onClose();
    } catch (error) {
      console.error('Payment failed:', error);
      toast.error(error.response?.data?.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  if (!order) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Icon name="creditCard" className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Process Payment</h3>
              <p className="text-sm text-gray-500">Order #{order.orderNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
          >
            <Icon name="close" className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Summary */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Order Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">${parseFloat(order.subtotal).toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-medium text-red-600">-${parseFloat(order.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Tax:</span>
                <span className="font-medium">
                  ${(parseFloat(order.total) - parseFloat(order.subtotal) + parseFloat(order.discount || 0)).toFixed(2)}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">Total:</span>
                  <span className="text-lg font-bold text-green-600">${parseFloat(order.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Payment Type</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setPaymentType('full')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  paymentType === 'full'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <span className="text-2xl">💳</span>
                  <span className="font-medium">Full Payment</span>
                  <span className="text-xs text-gray-500">Complete payment</span>
                </div>
              </button>
              <button
                onClick={() => setPaymentType('split')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  paymentType === 'split'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <span className="text-2xl">✂️</span>
                  <span className="font-medium">Split Payment</span>
                  <span className="text-xs text-gray-500">Multiple amounts</span>
                </div>
              </button>
            </div>
          </div>

          {/* Payment Panels */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-medium text-gray-700">
                {paymentType === 'full' ? 'Payment Methods' : 'Split Amounts'}
              </label>
              <button
                onClick={addPaymentPanel}
                className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <Icon name="plus" className="w-4 h-4" />
                <span>Add Payment</span>
              </button>
            </div>

            <div className="space-y-3">
              {paymentPanels.map((panel, index) => (
                <div key={panel.id} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      Payment {index + 1}
                    </span>
                    {paymentPanels.length > 1 && (
                      <button
                        onClick={() => removePaymentPanel(panel.id)}
                        className="p-1 text-red-600 hover:text-red-700"
                      >
                        <Icon name="close" className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {/* Currency Selection */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Currency</label>
                      <select
                        value={panel.currency}
                        onChange={(e) => handlePanelChange(panel.id, 'currency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        <option value="USD">💵 USD</option>
                        <option value="Riel">🇰🇭 Riel</option>
                      </select>
                    </div>

                    {/* Payment Method Selection */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Payment Method</label>
                      <select
                        value={panel.method}
                        onChange={(e) => handlePanelChange(panel.id, 'method', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        <option value="CASH">💵 Cash</option>
                        <option value="CARD">💳 Card</option>
                        <option value="QR">📱 QR</option>
                      </select>
                    </div>
                  </div>

                  {/* Amount Input */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Amount</label>
                    <input
                      type="number"
                      value={panel.amount}
                      onChange={(e) => handlePanelChange(panel.id, 'amount', e.target.value)}
                      placeholder={`Enter amount in ${panel.currency}`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Payment Summary */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment Total (USD):</span>
                  <span className="font-medium">${getTotalInUSD().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Remaining (USD):</span>
                  <span className={`font-medium ${getRemaining() < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    ${getRemaining().toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  <div>Payment Breakdown:</div>
                  {paymentPanels.map((panel, index) => (
                    <div key={panel.id} className="flex justify-between">
                      <span>Payment {index + 1} ({panel.method} - {panel.currency}):</span>
                      <span>{formatAmount(parseFloat(panel.amount) || 0, panel.currency)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              disabled={processing || Math.abs(getRemaining()) > 0.01}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {processing ? 'Processing...' : 'Process Payment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;