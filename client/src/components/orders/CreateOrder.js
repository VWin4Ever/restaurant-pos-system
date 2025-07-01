import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from 'axios';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';

const schema = yup.object({
  tableId: yup.number().required('Table is required'),
  customerNote: yup.string().optional(),
  discount: yup.number().min(0).max(100).optional()
}).required();

const CreateOrder = ({ onClose, onOrderCreated }) => {
  const [tables, setTables] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm({
    resolver: yupResolver(schema)
  });

  const watchedDiscount = watch('discount', 0);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    setDiscountPercent(parseFloat(watchedDiscount) || 0);
  }, [watchedDiscount]);

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
        tableId: data.tableId ? parseInt(data.tableId, 10) : undefined,
        customerNote: data.customerNote,
        discount: calculateDiscount(),
        items: orderItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      };

      console.log('Sending order data:', orderData);
      const response = await axios.post('/api/orders', orderData);
      console.log('Order created successfully:', response.data);
      toast.success('Order created successfully!');
      onOrderCreated(response.data.data);
      onClose();
    } catch (error) {
      console.error('Failed to create order:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-5/6 lg:w-4/5 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Create New Order</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Order Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Table *
              </label>
              <select
                {...register('tableId')}
                defaultValue=""
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.tableId ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Choose a table</option>
                {tables.map(table => (
                  <option key={table.id} value={table.id}>
                    Table {table.number} - {table.status} (Capacity: {table.capacity})
                  </option>
                ))}
              </select>
              {errors.tableId && (
                <p className="mt-1 text-sm text-red-600">{errors.tableId.message}</p>
              )}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Note
              </label>
              <textarea
                {...register('customerNote')}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Special instructions, allergies, etc."
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
                {/* Search Bar */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search products..."
                    className="input w-full max-w-xs"
                  />
                </div>
                {/* Category Filter */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('all')}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-150 ${selectedCategory === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      All
                    </button>
                    {categories.map(category => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setSelectedCategory(category.name)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-150 ${selectedCategory === category.name ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Products Grid */}
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredProducts.map(product => (
                    <div
                      key={product.id}
                      className={`border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer flex flex-col gap-2 ${!product.isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                      tabIndex={0}
                      onClick={() => addToOrder(product)}
                      onKeyDown={e => { if (e.key === 'Enter') addToOrder(product); }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">{product.name}</h4>
                        <span className="text-lg font-bold text-primary-600">
                          ${parseFloat(product.price).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {product.category.name}
                        </span>
                        {!product.isActive && (
                          <span className="text-xs text-red-500 font-semibold ml-2">Inactive</span>
                        )}
                        <button
                          type="button"
                          className={`ml-auto text-primary-600 hover:text-primary-800 text-sm font-medium ${!product.isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={e => { e.stopPropagation(); addToOrder(product); }}
                          disabled={!product.isActive}
                        >
                          Add to Order
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="card sticky top-4 border-2 border-primary-100 bg-primary-50">
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
                            <span className="w-6 text-center">{item.quantity}</span>
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
                              className="ml-2 text-red-500 hover:text-red-700"
                              title="Remove"
                            >
                              🗑️
                            </button>
                          </div>
                          <span className="ml-4 font-semibold text-gray-900">${item.subtotal.toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="border-t pt-4 mt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <span>${calculateSubtotal().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Tax:</span>
                          <span>${calculateTax().toFixed(2)}</span>
                        </div>
                        {calculateDiscount() > 0 && (
                          <div className="flex justify-between text-sm">
                            <span>Discount:</span>
                            <span>-${calculateDiscount().toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-lg font-medium border-t pt-2 mt-2">
                          <span>Total:</span>
                          <span>${calculateTotal().toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="px-6 pb-6">
                  <button
                    type="submit"
                    className="btn-primary w-full py-3 text-lg font-semibold mt-2 disabled:opacity-50"
                    disabled={orderItems.length === 0 || submitting}
                  >
                    {submitting ? 'Placing Order...' : 'Place Order'}
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