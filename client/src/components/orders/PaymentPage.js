import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Icon from '../common/Icon';
import { useSettings } from '../../contexts/SettingsContext';
import SimpleReceiptModal from './SimpleReceiptModal';
import SplitReceiptManager from './SplitReceiptManager';

const PaymentPage = ({ order, onClose, onPaymentSuccess }) => {
  const { getTaxRate, settings } = useSettings();
  const [processing, setProcessing] = useState(false);
  
  // Get VAT rate from order's business snapshot if available, otherwise use current settings
  const getOrderVATRate = () => {
    if (order?.businessSnapshot) {
      try {
        const snapshot = typeof order.businessSnapshot === 'string' 
          ? JSON.parse(order.businessSnapshot) 
          : order.businessSnapshot;
        return snapshot.vatRate || snapshot.taxRate || getTaxRate();
      } catch (error) {
        console.error('Failed to parse business snapshot:', error);
        return getTaxRate();
      }
    }
    return getTaxRate();
  };
  const [activeTab, setActiveTab] = useState('full'); // 'full' or 'split'
  const [fullPaymentPanels, setFullPaymentPanels] = useState([
    { id: 1, currency: 'USD', method: 'CASH', amount: '' }
  ]);
  const [splitPaymentPanels, setSplitPaymentPanels] = useState([
    { id: 1, currency: 'USD', method: 'CASH', amount: '' },
    { id: 2, currency: 'USD', method: 'CASH', amount: '' }
  ]);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptType, setReceiptType] = useState('draft'); // 'draft' or 'final'
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [showSplitReceiptManager, setShowSplitReceiptManager] = useState(false);
  const [savedPaymentData, setSavedPaymentData] = useState(null);

  // Get exchange rate from business settings
  const exchangeRate = settings.business?.exchangeRate || 4100;
  const exchangeRates = {
    USD: 1,
    Riel: exchangeRate // Dynamic exchange rate from settings
  };

  const totalAmount = order ? parseFloat(order.total) : 0;

  // Get current payment panels based on active tab
  const getCurrentPaymentPanels = () => {
    return activeTab === 'full' ? fullPaymentPanels : splitPaymentPanels;
  };

  const setCurrentPaymentPanels = (panels) => {
    if (activeTab === 'full') {
      setFullPaymentPanels(panels);
    } else {
      setSplitPaymentPanels(panels);
    }
  };

  // Save payment data to localStorage
  const savePaymentData = useCallback((data) => {
    const paymentKey = `payment_${order.id}`;
    localStorage.setItem(paymentKey, JSON.stringify(data));
    setSavedPaymentData(data);
  }, [order.id]);

  // Load payment data from localStorage
  const loadPaymentData = useCallback(() => {
    const paymentKey = `payment_${order.id}`;
    const saved = localStorage.getItem(paymentKey);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setSavedPaymentData(data);
        setActiveTab(data.activeTab || 'full');
        
        // Load separate panels for each tab
        if (data.fullPaymentPanels) {
          setFullPaymentPanels(data.fullPaymentPanels);
        }
        if (data.splitPaymentPanels) {
          setSplitPaymentPanels(data.splitPaymentPanels);
        }
        
        return data;
      } catch (error) {
        console.error('Error loading payment data:', error);
        localStorage.removeItem(paymentKey);
      }
    }
    return null;
  }, [order.id]);

  // Clear saved payment data
  const clearPaymentData = useCallback(() => {
    const paymentKey = `payment_${order.id}`;
    localStorage.removeItem(paymentKey);
    setSavedPaymentData(null);
  }, [order.id]);

  // Initialize payment panels with smart defaults or saved data
  useEffect(() => {
    const savedData = loadPaymentData();
    if (!savedData) {
      // No saved data, use defaults
      // Pre-fill with total amount for full payment
      setFullPaymentPanels([{ 
        id: 1, 
        currency: 'USD', 
        method: 'CASH', 
        amount: totalAmount.toString() 
      }]);
      
      // Suggest equal split for split payment
      const splitAmount = (totalAmount / 2).toFixed(2);
      setSplitPaymentPanels([
        { id: 1, currency: 'USD', method: 'CASH', amount: splitAmount },
        { id: 2, currency: 'USD', method: 'CASH', amount: splitAmount }
      ]);
    }
  }, [totalAmount, loadPaymentData]);

  // Convert Riel to USD with proper rounding (for calculations)
  const convertRielToUSD = (rielAmount) => {
    const usdAmount = rielAmount / exchangeRates.Riel;
    // Always round to 2 decimals for USD precision - never compare floating values directly
    return Math.round(usdAmount * 100) / 100;
  };

  // Memoized calculations for performance - USD is primary currency
  const totalInUSD = useMemo(() => {
    const currentPanels = getCurrentPaymentPanels();
    const result = currentPanels.reduce((sum, panel) => {
      const amount = parseFloat(panel.amount) || 0;
      if (panel.currency === 'USD') {
        // USD is already in correct format
        return sum + amount;
      } else if (panel.currency === 'Riel') {
        // Convert Riel to USD immediately - USD is the source of truth
        const roundedUSD = convertRielToUSD(amount);
        return sum + roundedUSD;
      }
      return sum;
    }, 0);
    return result;
  }, [fullPaymentPanels, splitPaymentPanels, activeTab, exchangeRates.Riel]);

  const remaining = useMemo(() => {
    const roundedTotal = Math.round(totalAmount * 100) / 100;
    const roundedPayment = Math.round(totalInUSD * 100) / 100;
    const diff = roundedTotal - roundedPayment;
    // Fix tiny floating-point errors
    return Math.abs(diff) < 0.05 ? 0 : diff;
  }, [totalAmount, totalInUSD]);

  // Auto-calculate remaining amount for single payment
  useEffect(() => {
    const currentPanels = getCurrentPaymentPanels();
    if (activeTab === 'full' && currentPanels.length === 1 && remaining > 0) {
      // Auto-fill remaining amount if user hasn't entered anything
      const currentAmount = parseFloat(currentPanels[0].amount) || 0;
      if (currentAmount === 0) {
        setCurrentPaymentPanels(
          currentPanels.map(panel => 
            panel.id === currentPanels[0].id 
              ? { ...panel, amount: totalAmount.toString() }
              : panel
          )
        );
      }
    }
  }, [activeTab, fullPaymentPanels.length, splitPaymentPanels.length, remaining, totalAmount]);

  // Memoized callbacks for performance
  const handlePanelChange = useCallback((id, field, value) => {
    if (field === 'amount') {
      // For amount field, preserve the string format for display
      // but sanitize for calculations
      const sanitized = value.toString().replace(/[^0-9.]/g, '');
      
      // Handle multiple decimal points (keep only the first one)
      const parts = sanitized.split('.');
      const finalValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : sanitized;
      
      setCurrentPaymentPanels(prev => {
        const updated = prev.map(panel => 
          panel.id === id ? { ...panel, [field]: finalValue } : panel
        );
        // Auto-save the updated data
        savePaymentData({
          activeTab,
          fullPaymentPanels: activeTab === 'full' ? updated : fullPaymentPanels,
          splitPaymentPanels: activeTab === 'split' ? updated : splitPaymentPanels,
          timestamp: Date.now()
        });
        return updated;
      });
    } else {
      setCurrentPaymentPanels(prev => {
        const updated = prev.map(panel => 
          panel.id === id ? { ...panel, [field]: value } : panel
        );
        // Auto-save the updated data
        savePaymentData({
          activeTab,
          fullPaymentPanels: activeTab === 'full' ? updated : fullPaymentPanels,
          splitPaymentPanels: activeTab === 'split' ? updated : splitPaymentPanels,
          timestamp: Date.now()
        });
        return updated;
      });
    }
  }, [activeTab, savePaymentData, fullPaymentPanels, splitPaymentPanels]);

  const addPaymentPanel = useCallback(() => {
    const currentPanels = getCurrentPaymentPanels();
    const newId = Math.max(...currentPanels.map(p => p.id), 0) + 1;
    setCurrentPaymentPanels(prev => {
      const updated = [...prev, { 
        id: newId, 
        currency: 'USD', 
        method: 'CASH', 
        amount: '' 
      }];
      // Auto-save the updated data
      savePaymentData({
        activeTab,
        fullPaymentPanels: activeTab === 'full' ? updated : fullPaymentPanels,
        splitPaymentPanels: activeTab === 'split' ? updated : splitPaymentPanels,
        timestamp: Date.now()
      });
      return updated;
    });
  }, [activeTab, savePaymentData, fullPaymentPanels, splitPaymentPanels]);

  const removePaymentPanel = useCallback((id) => {
    const currentPanels = getCurrentPaymentPanels();
    if (currentPanels.length > 1) {
      setCurrentPaymentPanels(prev => {
        const updated = prev.filter(panel => panel.id !== id);
        // Auto-save the updated data
        savePaymentData({
          activeTab,
          fullPaymentPanels: activeTab === 'full' ? updated : fullPaymentPanels,
          splitPaymentPanels: activeTab === 'split' ? updated : splitPaymentPanels,
          timestamp: Date.now()
        });
        return updated;
      });
    }
  }, [activeTab, savePaymentData, fullPaymentPanels, splitPaymentPanels]);

  // Format currency amount
  const formatAmount = (amount, currency) => {
    if (currency === 'USD') {
      return `$${amount.toFixed(2)}`;
    } else if (currency === 'Riel') {
      // Round up Riel amounts to the nearest 100
      const roundedAmount = Math.ceil(amount / 100) * 100;
      return `${roundedAmount.toLocaleString()} Riel`;
    }
    return amount.toString();
  };

  // Convert USD to Riel for display purposes only
  const formatUSDToRiel = (usdAmount) => {
    const rielAmount = Math.ceil((usdAmount * exchangeRates.Riel) / 100) * 100; // Always round up to nearest 100
    return `${rielAmount.toLocaleString()} Riel`;
  };

  // Enhanced validation using memoized values
  const validatePayment = useCallback(() => {
    const errors = [];
    const currentPanels = getCurrentPaymentPanels();
    
    // Check for empty amounts
    currentPanels.forEach((panel, index) => {
      if (!panel.amount || parseFloat(panel.amount) <= 0) {
        errors.push(`Payment ${index + 1}: Amount is required and must be greater than 0`);
      }
    });
    
    // Check for negative amounts
    if (totalInUSD < 0) {
      errors.push('Total payment cannot be negative');
    }
    
    // Check for overpayment (allow 10% tolerance)
    if (totalInUSD > totalAmount * 1.1) {
      errors.push('Payment amount is too high (maximum 10% overpayment allowed)');
    }
    
    // Check for underpayment
    if (totalInUSD < totalAmount - 0.01) {
      errors.push('Payment amount is insufficient');
    }
    
    return errors;
  }, [totalInUSD, totalAmount, activeTab, fullPaymentPanels, splitPaymentPanels]);

  // Sanitize amount input
  const sanitizeAmount = (amount) => {
    // Allow numbers, decimal point, and basic formatting
    const sanitized = amount.toString().replace(/[^0-9.]/g, '');
    
    // Handle multiple decimal points (keep only the first one)
    const parts = sanitized.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Convert to number for validation
    const numericValue = parseFloat(sanitized);
    return isNaN(numericValue) ? 0 : numericValue;
  };


  // Handle draft receipt printing with validation
  const handleDraftReceipt = () => {
    // Validate payment data before allowing draft receipt
    const validationErrors = validatePayment();
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => toast.error(error));
      return;
    }
    
    if (activeTab === 'split') {
      // For split payments, show the SplitReceiptManager for draft receipts
      setShowSplitReceiptManager(true);
    } else {
      // For full payments, show regular draft receipt
      setReceiptType('draft');
      setShowReceiptModal(true);
    }
  };

  // Handle final receipt printing
  const handleFinalReceipt = () => {
    setReceiptType('final');
    setShowReceiptModal(true);
  };

  // Handle split receipt printing (for split payments)
  const handleSplitReceipts = () => {
    if (activeTab === 'split') {
      // For split payments, show the SplitReceiptManager
      setShowSplitReceiptManager(true);
    } else {
      // For full payments, show regular receipt
      handleFinalReceipt();
    }
  };

  // Process payment with enhanced error handling
  const handlePayment = async () => {
    if (!order) return;

    // Pre-validation
    const validationErrors = validatePayment();
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => toast.error(error));
      return;
    }

    setProcessing(true);
    try {
      const currentPanels = getCurrentPaymentPanels();
      
      // Determine primary currency from payment panels
      const primaryCurrency = currentPanels.length > 0 ? currentPanels[0].currency : 'USD';
      
      // Get the actual Riel amount if paying in Riel
      const rielAmount = primaryCurrency === 'Riel' ? 
        currentPanels.find(panel => panel.currency === 'Riel')?.amount || '0' : null;

      const paymentData = {
        currency: primaryCurrency, // Use the actual currency from payment
        rielAmount: rielAmount, // Send actual Riel amount paid
        splitBill: activeTab === 'split',
        splitAmounts: activeTab === 'split' ? currentPanels : [],
        mixedPayments: activeTab === 'full' && currentPanels.length > 1,
        paymentMethods: activeTab === 'full' ? currentPanels : [{ method: 'CASH', amount: totalAmount.toString(), id: 1 }],
        mixedCurrency: currentPanels.some(p => p.currency === 'Riel'),
        nestedPayments: false,
        splitMixedCurrency: false
      };

      await axios.patch(`/api/orders/${order.id}/pay`, paymentData);
      
      setPaymentCompleted(true);
      toast.success('Payment processed successfully!');
      
      // Clear saved payment data after successful payment
      clearPaymentData();
      
      // Auto-close after 2 seconds to allow receipt printing
      setTimeout(() => {
        if (onPaymentSuccess) {
          onPaymentSuccess();
        }
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Payment failed:', error);
      
      // Enhanced error handling
      if (error.response?.status === 400) {
        const errors = error.response.data.errors;
        if (errors && Array.isArray(errors)) {
          errors.forEach(err => toast.error(err.msg || err.message));
        } else {
          toast.error(error.response.data.message || 'Validation error');
        }
      } else if (error.response?.status === 404) {
        toast.error('Order not found');
      } else if (error.response?.status === 409) {
        toast.error('Order has already been paid');
      } else if (error.response?.status === 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error(error.response?.data?.message || 'Payment failed. Please try again.');
      }
    } finally {
      setProcessing(false);
    }
  };

  if (!order) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Icon name="creditCard" className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Pay</h3>
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

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Side - Payment Summary */}
          <div className="w-1/2 p-6 border-r border-gray-200 bg-gray-50 overflow-y-auto pb-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h4>
            
            {/* Order Details */}
            <div className="bg-white rounded-xl p-4 mb-4">
              <h5 className="font-medium text-gray-900 mb-3">Order Details</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Number:</span>
                  <span className="font-medium">#{order.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Table:</span>
                  <span className="font-medium">Table {order.table?.number || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cashier:</span>
                  <span className="font-medium">{order.user?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-xl p-4 mb-4">
              <h5 className="font-medium text-gray-900 mb-3">Order Summary</h5>
              {getCurrentPaymentPanels().some(panel => panel.currency === 'Riel') && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-700 font-medium">Exchange Rate:</span>
                    <span className="text-blue-800 font-bold">1 USD = {exchangeRates.Riel.toLocaleString()} Riel</span>
                  </div>
                </div>
              )}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">${parseFloat(order.subtotal).toFixed(2)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount ({Math.round((parseFloat(order.discount) / (order.orderItems.reduce((sum, item) => sum + parseFloat(item.subtotal), 0))) * 100)}%):</span>
                    <span className="font-medium text-red-600">-${parseFloat(order.discount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">VAT ({getOrderVATRate()}%):</span>
                  <span className="font-medium">
                    ${(parseFloat(order.total) - parseFloat(order.subtotal) + parseFloat(order.discount || 0)).toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">Total (USD):</span>
                    <span className="text-lg font-bold text-green-600">${parseFloat(order.total).toFixed(2)}</span>
                  </div>
                  {getCurrentPaymentPanels().some(panel => panel.currency === 'Riel') && (
                    <div className="flex justify-between mt-1">
                      <span className="font-semibold text-gray-900">Total (Riel):</span>
                      <span className="text-lg font-bold text-orange-600">{formatUSDToRiel(parseFloat(order.total))}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-white rounded-xl p-4">
              <h5 className="font-medium text-gray-900 mb-3">Payment Summary</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Total (USD):</span>
                  <span className="font-medium">${totalInUSD.toFixed(2)}</span>
                </div>
                {getCurrentPaymentPanels().some(panel => panel.currency === 'Riel') && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Total (Riel):</span>
                    <span className="font-medium text-orange-600">{formatUSDToRiel(totalInUSD)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Remaining (USD):</span>
                  <span className={`font-medium ${remaining < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    ${remaining.toFixed(2)}
                  </span>
                </div>
                {getCurrentPaymentPanels().some(panel => panel.currency === 'Riel') && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Remaining (Riel):</span>
                    <span className={`font-medium ${remaining < 0 ? 'text-red-600' : 'text-orange-600'}`}>
                      {formatUSDToRiel(remaining)}
                    </span>
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-3">
                  <div className="font-medium mb-2">Payment Breakdown:</div>
                  {getCurrentPaymentPanels().map((panel, index) => (
                    <div key={panel.id} className="flex justify-between">
                      <span>Payment {index + 1} ({panel.method} - {panel.currency}):</span>
                      <span>{formatAmount(parseFloat(panel.amount) || 0, panel.currency)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Payment Tabs */}
          <div className="w-1/2 p-6 flex flex-col overflow-y-auto">
            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => {
                  setActiveTab('full');
                  // Auto-save tab change
                  savePaymentData({
                    activeTab: 'full',
                    fullPaymentPanels,
                    splitPaymentPanels,
                    timestamp: Date.now()
                  });
                }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'full'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                💳 Full Payment
              </button>
              <button
                onClick={() => {
                  setActiveTab('split');
                  // Auto-save tab change
                  savePaymentData({
                    activeTab: 'split',
                    fullPaymentPanels,
                    splitPaymentPanels,
                    timestamp: Date.now()
                  });
                }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'split'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ✂️ Split Payment
              </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto">
              {/* Payment Panels */}
              <div className="space-y-4">
                {getCurrentPaymentPanels().map((panel, index) => (
                  <div key={panel.id} className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="space-y-4">
                      {/* Currency and Payment Selection Row */}
                      <div className="flex items-start space-x-6">
                        {/* Currency Selection */}
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handlePanelChange(panel.id, 'currency', 'USD')}
                              className={`flex-1 px-4 py-4 rounded-lg border-2 transition-all ${
                                panel.currency === 'USD'
                                  ? 'border-green-500 bg-green-50 text-green-700'
                                  : 'border-gray-300 hover:border-gray-400 bg-white'
                              }`}
                            >
                              <div className="flex justify-center">
                                <span className="text-2xl">💵</span>
                              </div>
                            </button>
                            <button
                              onClick={() => handlePanelChange(panel.id, 'currency', 'Riel')}
                              className={`flex-1 px-4 py-4 rounded-lg border-2 transition-all ${
                                panel.currency === 'Riel'
                                  ? 'border-green-500 bg-green-50 text-green-700'
                                  : 'border-gray-300 hover:border-gray-400 bg-white'
                              }`}
                            >
                              <div className="flex justify-center">
                                <span className="text-2xl">🇰🇭</span>
                              </div>
                            </button>
                          </div>
                        </div>

                        {/* Payment Method Selection */}
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Payment</label>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handlePanelChange(panel.id, 'method', 'CASH')}
                              className={`flex-1 px-3 py-4 rounded-lg border-2 transition-all ${
                                panel.method === 'CASH'
                                  ? 'border-green-500 bg-green-50 text-green-700'
                                  : 'border-gray-300 hover:border-gray-400 bg-white'
                              }`}
                            >
                              <div className="flex justify-center">
                                <span className="text-2xl">💵</span>
                              </div>
                            </button>
                            <button
                              onClick={() => handlePanelChange(panel.id, 'method', 'CARD')}
                              className={`flex-1 px-3 py-4 rounded-lg border-2 transition-all ${
                                panel.method === 'CARD'
                                  ? 'border-green-500 bg-green-50 text-green-700'
                                  : 'border-gray-300 hover:border-gray-400 bg-white'
                              }`}
                            >
                              <div className="flex justify-center">
                                <span className="text-2xl">💳</span>
                              </div>
                            </button>
                            <button
                              onClick={() => handlePanelChange(panel.id, 'method', 'QR')}
                              className={`flex-1 px-3 py-4 rounded-lg border-2 transition-all ${
                                panel.method === 'QR'
                                  ? 'border-green-500 bg-green-50 text-green-700'
                                  : 'border-gray-300 hover:border-gray-400 bg-white'
                              }`}
                            >
                              <div className="flex justify-center">
                                <span className="text-2xl">📱</span>
                              </div>
                            </button>
                          </div>
                        </div>

                        {/* Remove Button */}
                        {getCurrentPaymentPanels().length > 1 && (
                          <div className="flex items-end">
                            <button
                              onClick={() => removePaymentPanel(panel.id)}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Icon name="close" className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Amount Input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={panel.amount}
                            onChange={(e) => handlePanelChange(panel.id, 'amount', e.target.value)}
                            placeholder={`Enter amount in ${panel.currency} (e.g., 25.50)`}
                            className={`w-full px-4 py-3 text-lg border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              panel.amount && parseFloat(panel.amount) <= 0 
                                ? 'border-red-300 bg-red-50' 
                                : 'border-gray-300'
                            }`}
                            inputMode="decimal"
                            pattern="[0-9]*\.?[0-9]*"
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">
                            {panel.currency === 'USD' ? '💵' : '🇰🇭'}
                          </div>
                        </div>
                        {panel.amount && parseFloat(panel.amount) <= 0 && (
                          <p className="text-red-500 text-xs mt-1">Amount must be greater than 0</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Payment Button */}
              <div className="text-center py-4">
                <button
                  onClick={addPaymentPanel}
                  className="flex items-center space-x-2 mx-auto px-4 py-2 text-blue-600 hover:text-blue-700 font-medium border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Icon name="plus" className="w-4 h-4" />
                  <span>Add Payment</span>
                </button>
              </div>
            </div>

            {/* Receipt Printing Options */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Receipt Options</h4>
              <div className="flex space-x-2">
                <button
                  onClick={handleDraftReceipt}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Icon name="receipt" className="w-4 h-4" />
                  <span>Print Draft Receipt</span>
                </button>
                {paymentCompleted && (
                  <button
                    onClick={handleSplitReceipts}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Icon name="print" className="w-4 h-4" />
                    <span>{activeTab === 'split' ? 'Print Split Receipts' : 'Print Final Receipt'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Fixed Action Buttons */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200 bg-white">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={processing || Math.abs(remaining) > 0.01}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {processing ? 'Processing...' : 'Pay'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && (
        <SimpleReceiptModal
          order={order}
          receiptType={receiptType}
          paymentData={savedPaymentData}
          onClose={() => setShowReceiptModal(false)}
        />
      )}

      {/* Split Receipt Manager Modal */}
      {showSplitReceiptManager && (
        <SplitReceiptManager
          order={order}
          paymentData={savedPaymentData}
          receiptType={paymentCompleted ? 'final' : 'draft'}
          onClose={() => setShowSplitReceiptManager(false)}
        />
      )}
    </div>
  );
};

export default PaymentPage;