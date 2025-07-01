import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from 'axios';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';

const schema = yup.object({
  customerNote: yup.string().optional(),
  discount: yup.number().min(0).max(100).optional()
}).required();

const EditOrder = ({ order, onClose, onOrderUpdated }) => {
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

  const calculateSubtotal = () => {
    return orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.1; // 10% tax
  };

  const calculateDiscount = () => {
    return (calculateSubtotal() * discountPercent) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() - calculateDiscount();
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
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-5/6 lg:w-4/5 shadow-lg rounded-md bg-white">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-5/6 lg:w-4/5 shadow-lg rounded-md bg-white">
          <div className="text-center py-8">
            <div className="text-red-600 text-lg font-medium mb-4">{error}</div>
            <button
              onClick={fetchData}
              className="btn-primary mr-4"
            >
              Retry
            </button>
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-5/6 lg:w-4/5 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Edit Order - {order.orderNumber}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Order Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-500">Order #:</span>
                <p className="text-gray-900">{order.orderNumber}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Table:</span>
                <p className="text-gray-900">Table {order.table?.number}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Status:</span>
                <p className="text-gray-900">{order.status}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Created:</span>
                <p className="text-gray-900">
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Note
              </label>
              <textarea
                {...register('customerNote')}
                rows="3"
                className="input"
                placeholder="Special instructions, allergies, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount (%)
              </label>
              <input
                {...register('discount')}
                type="number"
                min="0"
                max="100"
                step="0.01"
                className="input"
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Products Selection */}
            <div className="lg:col-span-2">
              <div className="card">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Select Products</h3>
                </div>
                
                {/* Category Filter */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('all')}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedCategory === 'all'
                          ? 'bg-primary-100 text-primary-800'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      All
                    </button>
                    {categories.map(category => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setSelectedCategory(category.name)}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          selectedCategory === category.name
                            ? 'bg-primary-100 text-primary-800'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
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
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => addToOrder(product)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900">{product.name}</h4>
                          <span className="text-lg font-bold text-primary-600">
                            ${parseFloat(product.price).toFixed(2)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {product.category.name}
                          </span>
                          <button
                            type="button"
                            className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                          >
                            Add to Order
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="card sticky top-4">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Order Summary</h3>
                </div>
                
                <div className="p-6">
                  {orderItems.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No items added yet</p>
                  ) : (
                    <div className="space-y-4">
                      {orderItems.map(item => (
                        <div key={item.productId} className="flex justify-between items-center">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.product.name}</p>
                            <p className="text-sm text-gray-600">${item.price.toFixed(2)} each</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                            >
                              -
                            </button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => removeItem(item.productId)}
                              className="text-red-600 hover:text-red-800 ml-2"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}

                      <div className="border-t pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <span>${calculateSubtotal().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Tax (10%):</span>
                          <span>${calculateTax().toFixed(2)}</span>
                        </div>
                        {discountPercent > 0 && (
                          <div className="flex justify-between text-sm">
                            <span>Discount ({discountPercent}%):</span>
                            <span className="text-red-600">-${calculateDiscount().toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-lg font-bold border-t pt-2">
                          <span>Total:</span>
                          <span>${calculateTotal().toFixed(2)}</span>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={submitting || orderItems.length === 0}
                        className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? (
                          <div className="flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Updating Order...
                          </div>
                        ) : (
                          'Update Order'
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