import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from 'axios';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';
import Icon from '../common/Icon';
import { useSettings } from '../../contexts/SettingsContext';

const schema = yup.object({
  customerNote: yup.string().optional(),
  discount: yup.number().min(0).max(100).optional()
}).required();

const EditOrder = ({ order, onClose, onOrderUpdated }) => {
  const { calculateTax } = useSettings();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    if (order) {
      fetchData();
    }
  }, [order]);

  useEffect(() => {
    setDiscountPercent(parseFloat(watchedDiscount) || 0);
  }, [watchedDiscount]);

  const fetchData = async () => {
    try {
      setError(null);
      setLoading(true);

      const [productsRes, categoriesRes] = await Promise.all([
        axios.get('/api/products'),
        axios.get('/api/categories')
      ]);

      setProducts(productsRes.data.data);
      setCategories(categoriesRes.data.data);
      
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
        const existingDiscountPercent = existingSubtotal > 0 ? (order.discount / existingSubtotal) * 100 : 0;

        // Set form values
        setValue('customerNote', order.customerNote || '');
        setValue('discount', existingDiscountPercent);
        setDiscountPercent(existingDiscountPercent);
      } else {
        // Handle case where orderItems is not available
        console.warn('Order items not available, initializing empty order');
        setOrderItems([]);
        setValue('customerNote', order?.customerNote || '');
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
  };

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(product => product.category.name === selectedCategory);

  const addToOrder = (product) => {
    const existingItem = orderItems.find(item => item.productId === product.id);
    if (existingItem) {
      updateQuantity(product.id, existingItem.quantity + 1);
    } else {
      setOrderItems([...orderItems, {
        productId: product.id,
        product: product,
        quantity: 1,
        price: parseFloat(product.price),
        subtotal: parseFloat(product.price)
      }]);
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(productId);
      return;
    }
    setOrderItems(orderItems.map(item => 
      item.productId === productId 
        ? { ...item, quantity: newQuantity, subtotal: parseFloat(item.price) * newQuantity }
        : item
    ));
  };

  const removeItem = (productId) => {
    setOrderItems(orderItems.filter(item => item.productId !== productId));
  };

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

  const onSubmit = async (data) => {
    if (orderItems.length === 0) {
      toast.error('Please add at least one item to the order');
      return;
    }

    setSubmitting(true);
    try {
      const orderData = {
        customerNote: data.customerNote,
        discount: calculateDiscount(),
        items: orderItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      };

      await axios.put(`/api/orders/${order.id}`, orderData);
      toast.success('Order updated successfully!');
      onOrderUpdated();
    } catch (error) {
      console.error('Failed to update order:', error);
      toast.error(error.response?.data?.message || 'Failed to update order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-primary-900/50 to-secondary-900/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border-0 w-11/12 md:w-5/6 lg:w-4/5 shadow-2xl rounded-2xl bg-gradient-to-br from-white to-gray-50">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-primary-900/50 to-secondary-900/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border-0 w-11/12 md:w-5/6 lg:w-4/5 shadow-2xl rounded-2xl bg-gradient-to-br from-white to-gray-50">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="alert" className="w-8 h-8 text-red-600" />
            </div>
            <div className="text-red-600 text-lg font-medium mb-6">{error}</div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={fetchData}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                <Icon name="refresh" className="w-5 h-5" />
                Retry
              </button>
              <button
                onClick={onClose}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-all duration-200"
              >
                <Icon name="close" className="w-5 h-5" />
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary-900/50 to-secondary-900/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 border-0 w-11/12 md:w-5/6 lg:w-4/5 shadow-2xl rounded-2xl bg-gradient-to-br from-white to-gray-50 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
              <Icon name="edit" className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Edit Order
              </h2>
              <p className="text-gray-600">#{order.orderNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400 rounded-lg p-2"
          >
            <Icon name="close" className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Order Info */}
          <div className="bg-gradient-to-r from-primary-50 to-secondary-50 p-6 rounded-xl border border-primary-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Icon name="info" className="w-5 h-5 text-primary-600" />
              Order Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="receipt" className="w-4 h-4 text-primary-500" />
                  <span className="font-medium text-gray-500">Order #:</span>
                </div>
                <p className="text-gray-900 font-semibold">{order.orderNumber}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="table" className="w-4 h-4 text-primary-500" />
                  <span className="font-medium text-gray-500">Table:</span>
                </div>
                <p className="text-gray-900 font-semibold">Table {order.table?.number}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="status" className="w-4 h-4 text-primary-500" />
                  <span className="font-medium text-gray-500">Status:</span>
                </div>
                <p className="text-gray-900 font-semibold capitalize">{order.status.toLowerCase()}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="calendar" className="w-4 h-4 text-primary-500" />
                  <span className="font-medium text-gray-500">Created:</span>
                </div>
                <p className="text-gray-900 font-semibold">
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Icon name="note" className="w-5 h-5 text-primary-600" />
                Customer Note
              </label>
              <textarea
                {...register('customerNote')}
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 resize-none"
                placeholder="Special instructions, allergies, etc."
              />
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Icon name="discount" className="w-5 h-5 text-primary-600" />
                Discount (%)
              </label>
              <input
                {...register('discount')}
                type="number"
                min="0"
                max="100"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Products Selection */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-secondary-50">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Icon name="food" className="w-6 h-6 text-primary-600" />
                    Select Products
                  </h3>
                </div>
                
                {/* Category Filter */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('all')}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                        selectedCategory === 'all'
                          ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                          selectedCategory === category.name
                            ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <Icon name="category" className="w-4 h-4" />
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Products Grid */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map(product => (
                      <div
                        key={product.id}
                        className="group relative overflow-hidden border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300 transform hover:scale-105 cursor-pointer bg-white"
                        onClick={() => addToOrder(product)}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-medium text-gray-900 flex-1">{product.name}</h4>
                          <span className="text-lg font-bold text-primary-600">
                            ${parseFloat(product.price).toFixed(2)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1">
                            <Icon name="category" className="w-3 h-3" />
                            {product.category.name}
                          </span>
                          <button
                            type="button"
                            className="text-primary-600 hover:text-primary-800 text-sm font-medium flex items-center gap-1 transition-colors duration-200"
                          >
                            <Icon name="plus" className="w-4 h-4" />
                            Add to Order
                          </button>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 to-primary-500/0 group-hover:from-primary-500/5 group-hover:to-primary-500/10 transition-all duration-300"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-xl border border-gray-200 sticky top-4">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-secondary-50">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Icon name="receipt" className="w-6 h-6 text-primary-600" />
                    Order Summary
                  </h3>
                </div>
                
                <div className="p-6">
                  {orderItems.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <Icon name="cart" className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p>No items added yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orderItems.map(item => (
                        <div key={item.productId} className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm border border-gray-100">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 flex items-center gap-2">
                              <Icon name="food" className="w-4 h-4 text-primary-500" />
                              {item.product.name}
                            </p>
                            <p className="text-sm text-gray-600">${item.price.toFixed(2)} each</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors duration-200"
                            >
                              <Icon name="minus" className="w-4 h-4 text-gray-700" />
                            </button>
                            <span className="w-8 text-center font-semibold text-gray-900">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors duration-200"
                            >
                              <Icon name="plus" className="w-4 h-4 text-gray-700" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeItem(item.productId)}
                              className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center hover:bg-red-200 text-red-600 transition-colors duration-200 ml-2"
                            >
                              <Icon name="trash" className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}

                      <div className="border-t pt-4 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
                        </div>
                        {discountPercent > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Discount ({discountPercent}%):</span>
                            <span className="font-medium text-red-600">-${calculateDiscount().toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-lg font-bold border-t pt-3">
                          <span className="text-gray-900">Total:</span>
                          <span className="text-primary-600">${calculateTotal().toFixed(2)}</span>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={submitting || orderItems.length === 0}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditOrder; 