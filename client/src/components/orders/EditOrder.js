import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from 'axios';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';
import Icon from '../common/Icon';
import { useSettings } from '../../contexts/SettingsContext';

const schema = yup.object({
  discount: yup.number().min(0).max(100).optional()
}).required();

const EditOrder = ({ order, onClose, onOrderUpdated }) => {
  const { calculateTax, formatCurrency, getTaxRate } = useSettings();
  
  // Core state
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // UI state
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingDiscount, setEditingDiscount] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [showTableSelector, setShowTableSelector] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  
  // Refs
  const discountButtonRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm({
    resolver: yupResolver(schema)
  });

  const watchedDiscount = watch('discount', 0);

  // Handle table change
  const handleTableChange = async (newTable) => {
    try {
      setSubmitting(true);
      
      // Use the new table change endpoint
      const response = await axios.patch(`/api/orders/${order.id}/table`, {
        tableId: newTable.id
      });
      
      // Update local state
      setSelectedTable(newTable);
      setShowTableSelector(false);
      
      // Update the order data with the response
      onOrderUpdated(response.data.data);
      
    } catch (error) {
      console.error('Failed to change table:', error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Failed to change table assignment');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Memoized calculations for better performance
  const calculations = useMemo(() => {
    const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = calculateTax(subtotal);
    const discount = (subtotal * discountPercent) / 100;
    const total = subtotal + tax - discount;
    
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      total: Math.round(total * 100) / 100
    };
  }, [orderItems, discountPercent, calculateTax]);

  // Memoized filtered products for better performance
  const filteredProducts = useMemo(() => {
    if (!products.length) return [];
    
    return products.filter(product => {
      const matchesCategory = selectedCategory === 'all' || product.category?.name === selectedCategory;
      const matchesSearch = !searchTerm || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  useEffect(() => {
    if (order && order.id) {
      fetchData();
    } else {
      console.warn('EditOrder: No valid order provided');
      setError('No order data available');
    }
  }, [order]);

  useEffect(() => {
    setDiscountPercent(parseFloat(watchedDiscount) || 0);
  }, [watchedDiscount]);

  // Optimized data fetching
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const [productsRes, categoriesRes, tablesRes] = await Promise.all([
        axios.get('/api/products'),
        axios.get('/api/categories'),
        axios.get('/api/tables')
      ]);

      setProducts(productsRes.data.data);
      setCategories(categoriesRes.data.data);
      
      // Filter tables to show available, reserved, or current table
      const availableTables = tablesRes.data.data.filter(table => 
        table.status === 'AVAILABLE' || table.status === 'RESERVED' || table.id === order.tableId
      );
      setTables(availableTables);
      setSelectedTable(order.table);
      
      // Initialize order items from existing order with null checks
      if (order && order.orderItems && Array.isArray(order.orderItems)) {
        setOrderItems(order.orderItems.map(item => ({
          productId: item.productId,
          product: item.product,
          quantity: item.quantity,
          price: parseFloat(item.price),
          subtotal: parseFloat(item.subtotal)
        })));

        // Calculate discount percentage from existing order
        const existingSubtotal = order.orderItems.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
        const existingDiscountPercent = existingSubtotal > 0 ? 
          Math.round((parseFloat(order.discount) / existingSubtotal) * 100) : 0;

        // Set form values
        setValue('discount', existingDiscountPercent);
        setDiscountPercent(existingDiscountPercent);
      } else {
        // Handle case where orderItems is not available
        console.warn('Order items not available, initializing empty order');
        setOrderItems([]);
        setValue('discount', 0);
        setDiscountPercent(0);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('Failed to load order data. Please try again.');
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [order, setValue]);


  // Optimized item management
  const addToOrder = useCallback((product) => {
    setOrderItems(prev => {
      const existingItem = prev.find(item => item.productId === product.id);
      if (existingItem) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1, subtotal: item.price * (item.quantity + 1) }
            : item
        );
      } else {
        return [...prev, {
          productId: product.id,
          product: product,
          quantity: 1,
          price: parseFloat(product.price),
          subtotal: parseFloat(product.price)
        }];
      }
    });
  }, []);

  const updateQuantity = useCallback((productId, newQuantity) => {
    if (newQuantity <= 0) {
      setOrderItems(prev => prev.filter(item => item.productId !== productId));
      return;
    }
    setOrderItems(prev => prev.map(item => 
      item.productId === productId 
        ? { ...item, quantity: newQuantity, subtotal: item.price * newQuantity }
        : item
    ));
  }, []);

  const removeItem = useCallback((productId) => {
    setOrderItems(prev => prev.filter(item => item.productId !== productId));
  }, []);


  // Optimized form submission
  const onSubmit = useCallback(async (data) => {
    if (orderItems.length === 0) {
      toast.error('Please add at least one item to the order');
      return;
    }

    // Validate order items
    const hasInvalidItems = orderItems.some(item => 
      !item.productId || !item.quantity || item.quantity <= 0
    );
    
    if (hasInvalidItems) {
      toast.error('Please ensure all items have valid quantities');
      return;
    }

    setSubmitting(true);
    try {
      const orderData = {
        discount: calculations.discount,
        items: orderItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      };

      const response = await axios.put(`/api/orders/${order.id}`, orderData);
      
      if (response.data.success) {
        // toast.success('Order updated successfully!');
        onOrderUpdated();
      } else {
        throw new Error(response.data.message || 'Failed to update order');
      }
    } catch (error) {
      console.error('Failed to update order:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.map(e => e.msg).join(', ') ||
                          'Failed to update order';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }, [orderItems, calculations.discount, order.id, onOrderUpdated]);

  // Safety check for order prop - after all hooks
  if (!order) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-background rounded-2xl shadow-large p-8 max-w-md w-full mx-4">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="alert" className="w-8 h-8 text-error" />
            </div>
            <div className="text-error text-lg font-medium mb-6">No order data available</div>
            <button onClick={onClose} className="btn-primary">
              <Icon name="close" className="w-5 h-5 mr-2" />
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-background rounded-2xl shadow-large p-8 max-w-md w-full mx-4">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-background rounded-2xl shadow-large p-8 max-w-md w-full mx-4 transform animate-fade-in-up">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="alert" className="w-8 h-8 text-error" />
            </div>
            <div className="text-error text-lg font-medium mb-6">{error}</div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={fetchData}
                className="btn-primary"
              >
                <Icon name="refresh" className="w-5 h-5 mr-2" />
                Retry
              </button>
              <button
                onClick={onClose}
                className="btn-secondary"
              >
                <Icon name="close" className="w-5 h-5 mr-2" />
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-start justify-center py-2 sm:py-4">
      <div className="relative mx-auto px-2 sm:px-4 py-4 sm:py-6 w-full max-w-7xl shadow-large rounded-2xl bg-background min-h-[95vh] max-h-[98vh] sm:min-h-[90vh] sm:max-h-[95vh] overflow-y-auto">
        {/* Close button in top right corner */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors duration-200 z-10"
          aria-label="Close edit order"
        >
          <Icon name="close" className="w-5 h-5 text-neutral-600" />
        </button>

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mb-4 flex justify-center">
            <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center shadow-soft">
              <Icon name="edit" className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-text-primary mb-2">
            Edit Order
          </h2>
          <p className="text-text-secondary">#{order.orderNumber} - Table {order.table?.number}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col lg:flex-row gap-4 sm:gap-6 min-h-0">
          {/* Products Selection */}
          <div className="flex-1 flex flex-col">
            <div className="bg-surface rounded-xl shadow-soft border border-neutral-100 overflow-hidden flex flex-col max-h-[70vh]">
              <div className="px-6 py-4 border-b border-neutral-200 bg-gradient-to-r from-primary-50 to-primary-100">
                <h3 className="text-xl font-semibold text-text-primary flex items-center gap-2">
                  <Icon name="food" className="w-6 h-6 text-primary-600" />
                  Select Products
                </h3>
              </div>
              
              {/* Category Filter and Search */}
              <div className="px-6 py-4 border-b border-neutral-200 bg-surface">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Category Filter */}
                  <div className="flex flex-wrap gap-2 flex-1">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('all')}
                      className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200 whitespace-nowrap ${
                        selectedCategory === 'all' 
                          ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white border-primary-600 shadow-soft' 
                          : 'bg-surface text-text-primary border-neutral-200 hover:bg-surfaceHover hover:border-primary-300'
                      }`}
                    >
                      <Icon name="grid" className="w-4 h-4" />
                      All
                    </button>
                    {categories.map(category => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setSelectedCategory(category.name)}
                        className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200 whitespace-nowrap ${
                          selectedCategory === category.name 
                            ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white border-primary-600 shadow-soft' 
                            : 'bg-surface text-text-primary border-neutral-200 hover:bg-surfaceHover hover:border-primary-300'
                        }`}
                      >
                        <Icon name="category" className="w-4 h-4" />
                        {category.name}
                      </button>
                    ))}
                  </div>
                  
                  {/* Search */}
                  <div className="relative sm:w-64">
                    <Icon name="search" className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-2 sm:py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-600 transition-all duration-200 text-sm sm:text-base bg-background"
                    />
                  </div>
                </div>
              </div>

              {/* Products Grid */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 min-h-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 pb-4">
                  {filteredProducts.length === 0 ? (
                    <div className="col-span-full text-center text-text-muted py-12">
                      <Icon name="search" className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
                      <p className="text-lg">No products found.</p>
                    </div>
                  ) : (
                    filteredProducts.map(product => (
                      <div
                        key={product.id}
                        className={`group relative flex flex-col items-center justify-between p-4 rounded-xl border-2 bg-gradient-to-br from-primary-50 to-surface shadow-soft transition-all duration-200 hover:shadow-medium hover:scale-[1.02] min-h-[200px] ${!product.isActive ? 'opacity-50 pointer-events-none' : ''} ${orderItems.some(item => item.productId === product.id) ? 'border-primary-600 shadow-medium' : 'border-primary-100'}`}
                      >
                        <div className="flex-1 flex flex-col items-center justify-center w-full">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded-lg mb-3 shadow-soft"
                              onError={e => { if (e.target && e.target.style) { e.target.style.display = 'none'; } }}
                            />
                          ) : (
                            <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center mb-3">
                              <Icon name="food" className="w-8 h-8 text-primary-500" />
                            </div>
                          )}
                          <div className="text-center w-full">
                            <div className="font-medium text-text-primary break-words max-w-[120px] mx-auto mb-1 text-sm">{product.name}</div>
                            <div className="text-sm font-bold text-primary-600 mb-2">${parseFloat(product.price).toFixed(2)}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => addToOrder(product)}
                          className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold shadow-soft hover:shadow-medium transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-primary-500/20"
                          disabled={!product.isActive || submitting}
                          aria-label={`Add ${product.name} to order`}
                        >
                          <Icon name="plus" className="w-6 h-6" />
                        </button>
                        {!product.isActive && (
                          <span className="absolute top-2 left-2 text-xs bg-error text-white px-2 py-1 rounded-full flex items-center gap-1">
                            <Icon name="close" className="w-3 h-3" />
                            Inactive
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Order Summary Section */}
          <div className="lg:w-96 w-full flex flex-col gap-6">
            <div className="bg-surface rounded-xl shadow-soft border border-neutral-100 p-6 lg:sticky lg:top-8 h-fit self-start w-full max-h-[70vh] overflow-y-auto flex flex-col">
              <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Icon name="cart" className="w-5 h-5 text-primary-600" />
                Order Summary
              </h3>
              
              {/* Table Info */}
              <div className="flex items-center justify-between mb-4 p-3 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border border-primary-200">
                <div className="flex items-center gap-2">
                  <Icon name="table" className="w-5 h-5 text-primary-600" />
                  <span className="font-semibold text-primary-700">
                    Table {selectedTable?.number || order.table?.number}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowTableSelector(!showTableSelector)}
                    className="text-xs px-2 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
                    disabled={submitting}
                  >
                    Change
                  </button>
                </div>
                <span className="text-sm text-primary-600 font-medium">
                  #{order.orderNumber}
                </span>
              </div>

              {/* Table Selector */}
              {showTableSelector && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Select New Table:</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {tables.map(table => (
                      <button
                        key={table.id}
                        type="button"
                        onClick={() => handleTableChange(table)}
                        disabled={submitting || table.id === order.tableId}
                        className={`p-2 text-xs rounded border transition-colors ${
                          table.id === order.tableId
                            ? 'bg-blue-100 border-blue-300 text-blue-700 cursor-not-allowed'
                            : 'bg-white border-gray-300 hover:border-primary-400 hover:bg-primary-50'
                        }`}
                      >
                        Table {table.number}
                        {table.id === order.tableId && ' (Current)'}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTableSelector(false)}
                    className="mt-2 text-xs text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              )}


              
              {/* Order Items */}
              {orderItems.length === 0 ? (
                <div className="text-center text-text-muted py-8">
                  <Icon name="cart" className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
                  <p>No items added yet</p>
                </div>
              ) : (
                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto custom-scrollbar">
                  {orderItems.map(item => (
                    <div key={item.productId} className="flex justify-between items-center p-3 bg-background rounded-lg shadow-soft border border-neutral-100">
                      <div className="flex-1">
                        <p className="font-medium text-text-primary flex items-center gap-2">
                          <Icon name="food" className="w-4 h-4 text-primary-500" />
                          {item.product.name}
                        </p>
                        <p className="text-sm text-text-secondary">${item.price.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors duration-200"
                        >
                          <Icon name="minus" className="w-4 h-4 text-text-primary" />
                        </button>
                        <span className="w-8 text-center font-semibold text-text-primary">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors duration-200"
                        >
                          <Icon name="plus" className="w-4 h-4 text-text-primary" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(item.productId)}
                          className="w-8 h-8 rounded-full bg-error/10 flex items-center justify-center hover:bg-error/20 text-error transition-colors duration-200 ml-2"
                        >
                          <Icon name="trash" className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Totals */}
              <div className="border-t border-neutral-200 pt-4 space-y-3 mt-auto">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Subtotal:</span>
                  <span className="font-medium text-text-primary">{formatCurrency(calculations.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">VAT ({getTaxRate()}%):</span>
                  <span className="font-medium text-text-primary">{formatCurrency(calculations.tax)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  {editingDiscount ? (
                    <input
                      type="number"
                      {...register('discount')}
                      min="0"
                      max="100"
                      step="1"
                      autoFocus
                      onBlur={() => setEditingDiscount(false)}
                      className="w-16 px-2 py-1 border border-neutral-200 rounded text-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-600 transition-all duration-200"
                      placeholder="0"
                      disabled={submitting}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setValue('discount', value);
                        setDiscountPercent(value);
                      }}
                      onKeyDown={(e) => {
                        // Prevent decimal point and other non-integer characters
                        if (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                          e.preventDefault();
                        }
                        if (e.key === 'Enter') setEditingDiscount(false);
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      ref={discountButtonRef}
                      className="text-text-secondary hover:text-primary-600 hover:underline transition-colors duration-200"
                      onClick={() => setEditingDiscount(true)}
                      aria-label="Edit discount"
                    >
                      Discount ({discountPercent || 0}%)
                    </button>
                  )}
                  <span className="font-medium text-error">-{formatCurrency(calculations.discount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-neutral-200 pt-3">
                  <span className="text-text-primary">Total:</span>
                  <span className="text-primary-600">{formatCurrency(calculations.total)}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || orderItems.length === 0}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold text-lg shadow-soft hover:shadow-medium transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-6 sticky bottom-0 z-10"
              >
                {submitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Updating Order...
                  </div>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Icon name="check" className="w-5 h-5" />
                    Update Order
                  </span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditOrder; 