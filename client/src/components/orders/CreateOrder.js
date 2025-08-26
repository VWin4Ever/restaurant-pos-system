import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from 'axios';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../common/Icon';

const schema = yup.object({
  tableId: yup.number().required('Table is required'),
  customerNote: yup.string().optional(),
  discount: yup.number().min(0).max(100).optional()
}).required();

const CreateOrder = ({ onClose, onOrderCreated }) => {
  const { calculateTax, formatCurrency } = useSettings();
  const { user, token } = useAuth();
  const [tables, setTables] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [step, setStep] = useState('table');
  const [selectedTable, setSelectedTable] = useState(null);
  const [success, setSuccess] = useState(false);
  const [orderConfirmation, setOrderConfirmation] = useState(null);
  const [totalAnim, setTotalAnim] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const discountButtonRef = useRef(null);
  const noteButtonRef = useRef(null);

  // Check mobile screen size
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const calculateSubtotal = () => {
    return orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const calculateTaxAmount = () => {
    return calculateTax(calculateSubtotal());
  };

  const calculateDiscount = () => {
    return (calculateSubtotal() * discountPercent) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTaxAmount() - calculateDiscount();
  };

  const prevTotalRef = useRef(calculateTotal());

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    control
  } = useForm({
    resolver: yupResolver(schema)
  });

  const selectedTableId = watch('tableId');
  const watchedDiscount = watch('discount', 0);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    setDiscountPercent(parseFloat(watchedDiscount) || 0);
  }, [watchedDiscount]);

  useEffect(() => {
    const newTotal = calculateTotal();
    if (prevTotalRef.current !== newTotal) {
      setTotalAnim(true);
      setTimeout(() => setTotalAnim(false), 300);
      prevTotalRef.current = newTotal;
    }
  }, [orderItems]);

  const fetchInitialData = async () => {
    try {
      const [tablesRes, productsRes, categoriesRes] = await Promise.all([
        axios.get('/api/tables'),
        axios.get('/api/products'),
        axios.get('/api/categories')
      ]);

      setTables(tablesRes.data.data.filter(table => table.status === 'AVAILABLE' || table.status === 'RESERVED'));
      setProducts(productsRes.data.data);
      setCategories(categoriesRes.data.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category.name === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToOrder = (product) => {
    if (!product.isActive) return;
    const existingItem = orderItems.find(item => item.productId === product.id);
    if (existingItem) {
      setOrderItems(orderItems.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * parseFloat(item.price) }
          : item
      ));
    } else {
      setOrderItems([...orderItems, {
        productId: product.id,
        product: product,
        quantity: 1,
        price: parseFloat(product.price),
        subtotal: parseFloat(product.price)
      }]);
    }
    toast.success(`${product.name} added to order!`);
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      setOrderItems(orderItems.filter(item => item.productId !== productId));
    } else {
      setOrderItems(orderItems.map(item => 
        item.productId === productId 
          ? { ...item, quantity: newQuantity, subtotal: newQuantity * parseFloat(item.price) }
          : item
      ));
    }
  };

  const removeItem = (productId) => {
    setOrderItems(orderItems.filter(item => item.productId !== productId));
  };

  const onSubmit = async (data) => {
    if (orderItems.length === 0) {
      toast.error('Please add at least one item to the order');
      return;
    }
    setSubmitting(true);
    try {
      const orderData = {
        tableId: data.tableId ? parseInt(data.tableId, 10) : undefined,
        customerNote: data.customerNote,
        discount: calculateDiscount(),
        items: orderItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      };
      const response = await axios.post('/api/orders', orderData);
      toast.success('Order created successfully!');
      setOrderConfirmation({
        table: selectedTable,
        items: orderItems,
        total: calculateTotal(),
        order: response.data.data
      });
      setSuccess(true);
      // Call the callback to refresh the orders list
      if (onOrderCreated) {
        onOrderCreated(response.data.data);
      }
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (success && orderConfirmation) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-background rounded-2xl shadow-large p-8 max-w-md w-full mx-4 transform animate-fade-in-up">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center animate-bounce">
              <Icon name="check" className="w-10 h-10 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-text-primary mb-4 text-center">Order Placed!</h2>
          <div className="mb-4 text-center">
            <div className="inline-flex items-center gap-2 bg-primary-50 px-4 py-2 rounded-full border border-primary-200">
              <Icon name="table" className="w-5 h-5 text-primary-600" />
              <span className="font-bold text-primary-700">Table {orderConfirmation.table?.number}</span>
            </div>
          </div>
          <div className="bg-surface rounded-xl p-4 mb-6 shadow-soft border border-neutral-100">
            <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Icon name="receipt" className="w-5 h-5 text-primary-600" />
              Order Summary
            </h3>
            <ul className="space-y-2">
              {orderConfirmation.items.map(item => (
                <li key={item.productId} className="flex justify-between items-center py-1 border-b border-neutral-100 last:border-b-0">
                  <span className="text-text-primary flex items-center gap-2">
                    <Icon name="food" className="w-4 h-4 text-primary-500" />
                    {item.product?.name || ''} x{item.quantity}
                  </span>
                  <span className="font-semibold text-primary-600">${(item.product?.price * item.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-full font-bold text-xl shadow-soft">
              <Icon name="currency" className="w-6 h-6" />
              Total: ${orderConfirmation.total.toFixed(2)}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-full btn-primary"
          >
            <Icon name="close" className="w-5 h-5 inline mr-2" />
            Close
          </button>
        </div>
      </div>
    );
  }

  if (step === 'table') {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center">
        <div className="relative mx-auto px-4 py-6 w-full max-w-2xl shadow-large rounded-2xl bg-background max-h-[90vh] overflow-hidden">
          {/* Close button in top right corner */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors duration-200 z-10"
            aria-label="Close table selection"
          >
            <Icon name="close" className="w-5 h-5 text-neutral-600" />
          </button>
          
          <div className="w-full max-w-xl mx-auto">
            <div className="mb-6 text-center">
              <div className="mb-4 flex justify-center">
                <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center shadow-soft">
                  <Icon name="table" className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
            
            {/* Table selection grid */}
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-4 gap-4">
                {tables.map(table => {
                  const isAvailable = table.status === 'AVAILABLE' || table.status === 'RESERVED';
                  return (
                    <button
                      key={table.id}
                      type="button"
                      onClick={() => {
                        setSelectedTable(table);
                        setValue('tableId', table.id);
                        setStep('order');
                      }}
                      className={`group flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-primary-500/20 text-center min-h-[120px] ${
                        isAvailable 
                          ? 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 shadow-soft' 
                          : 'border-neutral-200 bg-neutral-50 opacity-50 cursor-not-allowed'
                      }`}
                      disabled={!isAvailable}
                      tabIndex={0}
                      role="button"
                      aria-label={`Select Table ${table.number} (${table.status})`}
                    >
                      {isAvailable ? (
                        <>
                          <div className="text-lg font-bold text-text-primary mb-2 self-start">Table {table.number}</div>
                          <div className="flex-1 flex items-center justify-center mb-2">
                            <Icon name="table" className="w-8 h-8 text-text-primary" />
                          </div>
                          <div className="text-sm font-medium text-success">Available</div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-8 h-8 bg-neutral-200 rounded-lg"></div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm h-full w-full z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="relative mx-auto w-full max-w-screen-2xl shadow-large rounded-2xl bg-background h-[95vh] sm:h-[90vh] overflow-hidden">
        {/* Close button in top right corner */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors duration-200 z-50"
          aria-label="Close order creation"
        >
          <Icon name="close" className="w-5 h-5 text-neutral-600" />
        </button>
        
        <form onSubmit={handleSubmit(onSubmit)} className="w-full h-full">
          <div className="flex flex-col lg:flex-row lg:gap-6 w-full h-full">
            {/* Products Section */}
            <div className="lg:flex-1 flex flex-col min-h-0">
              {/* Header with Categories and Search */}
              <div className="pt-4 mb-4 sm:mb-6 sticky top-0 z-20 bg-background/95 backdrop-blur-sm pb-4 rounded-xl border-b border-neutral-100">
                {/* Categories - Compact Layout */}
                <div className="mb-4">
                  {/* First row - All button and first few categories */}
                  <div className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                    <button
                      className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                        selectedCategory === 'all' 
                          ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white border-primary-600 shadow-soft' 
                          : 'bg-surface text-text-primary border-neutral-200 hover:bg-surfaceHover hover:border-primary-300'
                      }`}
                      onClick={() => setSelectedCategory('all')}
                      type="button"
                    >
                      <Icon name="grid" className="w-3 h-3 sm:w-4 sm:h-4" />
                      All
                    </button>
                    {categories.slice(0, 4).map(category => (
                      <button
                        key={category.id}
                        className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                          selectedCategory === category.name 
                            ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white border-primary-600 shadow-soft' 
                            : 'bg-surface text-text-primary border-neutral-200 hover:bg-surfaceHover hover:border-primary-300'
                        }`}
                        onClick={() => setSelectedCategory(category.name)}
                        type="button"
                      >
                        <Icon name="category" className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">{category.name}</span>
                        <span className="sm:hidden">{category.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                  
                  {/* Second row - Remaining categories */}
                  {categories.length > 4 && (
                    <div className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                      {categories.slice(4).map(category => (
                        <button
                          key={category.id}
                          className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                            selectedCategory === category.name 
                              ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white border-primary-600 shadow-soft' 
                              : 'bg-surface text-text-primary border-neutral-200 hover:bg-surfaceHover hover:border-primary-300'
                          }`}
                          onClick={() => setSelectedCategory(category.name)}
                          type="button"
                        >
                          <Icon name="category" className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">{category.name}</span>
                          <span className="sm:hidden">{category.name.split(' ')[0]}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Search */}
                <div className="relative">
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
              
              {/* Products Grid */}
              <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ minHeight: '50vh' }}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 mb-6">
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
            
            {/* Order Summary Section */}
            <div className="lg:w-96 w-full flex flex-col gap-6 mt-6 lg:mt-0 lg:flex-shrink-0">
              <div className="bg-surface rounded-xl shadow-soft border border-neutral-100 p-6 lg:sticky lg:top-8 h-fit self-start w-full max-h-[80vh] overflow-y-auto flex flex-col">
                <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <Icon name="cart" className="w-5 h-5 text-primary-600" />
                  Order Summary
                </h3>
                
                {/* Table Info */}
                <div className="flex items-center justify-between mb-4 p-3 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border border-primary-200">
                  <div className="flex items-center gap-2">
                    <Icon name="table" className="w-5 h-5 text-primary-600" />
                    <span className="font-semibold text-primary-700">
                      {selectedTable ? `Table ${selectedTable.number}` : 'No Table Selected'}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="text-xs px-3 py-1 rounded bg-primary-200 hover:bg-primary-300 text-primary-700 font-semibold border border-primary-300 transition-all duration-200"
                    onClick={() => setStep('table')}
                    disabled={submitting}
                  >
                    Change
                  </button>
                </div>
                
                {/* Order Items */}
                {orderItems.length === 0 ? (
                  <div className="text-center text-text-muted py-8">
                    <Icon name="cart" className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
                    <p>No items in order.</p>
                  </div>
                ) : (
                  <ul className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                    {orderItems.map(item => (
                      <li key={item.productId} className="flex items-center gap-3 p-3 bg-background rounded-lg shadow-soft border border-neutral-100">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-text-primary break-words flex-1 min-w-0 truncate text-sm">{item.product.name}</div>
                          <div className="text-xs text-text-muted">${item.price.toFixed(2)} each</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="w-7 h-7 rounded-full bg-neutral-200 hover:bg-neutral-300 text-text-primary font-bold flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 flex-shrink-0 text-xs"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            aria-label={`Decrease quantity of ${item.product.name}`}
                            disabled={submitting}
                          >
                            <Icon name="minus" className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center font-semibold text-text-primary flex-shrink-0 text-sm">{item.quantity}</span>
                          <button
                            type="button"
                            className="w-7 h-7 rounded-full bg-neutral-200 hover:bg-neutral-300 text-text-primary font-bold flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 flex-shrink-0 text-xs"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            aria-label={`Increase quantity of ${item.product.name}`}
                            disabled={submitting}
                          >
                            <Icon name="plus" className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="min-w-[60px] text-right font-semibold text-primary-600 flex-shrink-0 text-sm">${(item.subtotal).toFixed(2)}</div>
                        <button
                          type="button"
                          className="w-7 h-7 rounded-full bg-error/10 hover:bg-error/20 text-error flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-error/50 flex-shrink-0"
                          onClick={() => removeItem(item.productId)}
                          aria-label={`Remove ${item.product.name} from order`}
                          disabled={submitting}
                        >
                          <Icon name="trash" className="w-3 h-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                
                <hr className="my-6 border-neutral-200" />
                
                {/* Order Totals */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Subtotal</span>
                    <span className="font-medium text-text-primary">${calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    {editingDiscount ? (
                      <input
                        type="number"
                        {...register('discount')}
                        min="0"
                        max="100"
                        autoFocus
                        onBlur={() => setEditingDiscount(false)}
                        onKeyDown={e => { if (e.key === 'Enter') setEditingDiscount(false); }}
                        className="w-16 px-2 py-1 border border-neutral-200 rounded text-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-600 transition-all duration-200"
                        placeholder="0"
                        disabled={submitting}
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
                    <span className="font-medium text-error">-${calculateDiscount().toFixed(2)}</span>
                  </div>
                  
                  {/* Total */}
                  <div className="flex justify-between items-center text-xl font-bold bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-lg px-4 py-3 mt-4">
                    <span className="text-text-primary">Total</span>
                    <span
                      className={`text-primary-700 transition-all duration-300 ${totalAnim ? 'scale-110 bg-primary-200 px-2 py-1 rounded' : ''}`}
                      aria-live="polite"
                    >
                      ${calculateTotal().toFixed(2)}
                    </span>
                  </div>
                </div>
                
                {/* Submit Button */}
                <div className="mt-auto pt-4">
                  <button
                    type="submit"
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold text-lg shadow-soft hover:shadow-medium transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center gap-2"
                    disabled={orderItems.length === 0 || submitting}
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Submitting...
                      </span>
                    ) : (
                      <>
                        <Icon name="check" className="w-5 h-5" />
                        Submit Order
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOrder; 