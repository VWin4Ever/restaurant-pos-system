import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Icon from '../common/Icon';

const PaymentModal = ({ order, onClose, onPaymentSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [processing, setProcessing] = useState(false);

  const handlePayment = async () => {
    if (!order) return;
    
    setProcessing(true);
    try {
      await axios.patch(`/api/orders/${order.id}/pay`, { 
        paymentMethod: paymentMethod 
      });
      
      toast.success('Payment processed successfully!');
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
      onClose();
    } catch (error) {
      console.error('Payment failed:', error);
      if (error.response?.data?.errors) {
        toast.error(error.response.data.errors.map(e => e.msg).join(', '));
      } else {
        toast.error(error.response?.data?.message || 'Payment failed');
      }
    } finally {
      setProcessing(false);
    }
  };

  if (!order) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Icon name="creditCard" className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Process Payment</h3>
              <p className="text-sm text-gray-600">Order #{order.orderNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
          >
            <Icon name="close" className="w-4 h-4" />
          </button>
        </div>

        {/* Order Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Subtotal:</span>
            <span className="font-medium">${parseFloat(order.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Tax:</span>
            <span className="font-medium">${parseFloat(order.tax).toFixed(2)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Discount:</span>
              <span className="font-medium text-red-600">-${parseFloat(order.discount).toFixed(2)}</span>
            </div>
          )}
          <div className="border-t border-gray-200 pt-2 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Total:</span>
              <span className="text-xl font-bold text-green-600">${parseFloat(order.total).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Payment Method
          </label>
          <div className="space-y-2">
            <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="paymentMethod"
                value="CARD"
                checked={paymentMethod === 'CARD'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mr-3"
              />
              <Icon name="creditCard" className="w-5 h-5 text-gray-600 mr-2" />
              <span className="font-medium">Card Payment</span>
            </label>
            <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="paymentMethod"
                value="CASH"
                checked={paymentMethod === 'CASH'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mr-3"
              />
              <Icon name="money" className="w-5 h-5 text-gray-600 mr-2" />
              <span className="font-medium">Cash Payment</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={processing}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </>
            ) : (
              <>
                <Icon name="check" className="w-4 h-4" />
                Process Payment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;




