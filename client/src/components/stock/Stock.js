import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from 'axios';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';
import { MagnifyingGlassIcon, FunnelIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

const schema = yup.object({
  quantity: yup.number().required('Quantity is required'),
  note: yup.string().optional(),
  type: yup.string().oneOf(['ADD', 'REMOVE', 'ADJUST']).required('Type is required')
}).required();

const Stock = () => {
  const [stockItems, setStockItems] = useState([]);
  const [filteredStockItems, setFilteredStockItems] = useState([]);
  const [stockLogs, setStockLogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('productName');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema)
  });

  useEffect(() => {
    fetchStockData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [stockItems, searchTerm, selectedStatus, selectedCategory, sortBy, sortOrder]);

  const fetchStockData = async () => {
    try {
      const [stockRes, logsRes, categoriesRes] = await Promise.all([
        axios.get('/api/stock'),
        axios.get('/api/stock/logs'),
        axios.get('/api/categories')
      ]);
      setStockItems(stockRes.data.data);
      setStockLogs(logsRes.data.data);
      setCategories(categoriesRes.data.data);
    } catch (error) {
      console.error('Failed to fetch stock data:', error);
      toast.error('Failed to load stock data');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...stockItems];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product.category.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (selectedStatus) {
      filtered = filtered.filter(item => {
        const status = getStockStatus(item.quantity, item.minStock);
        return status.status === selectedStatus;
      });
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(item => item.product.categoryId === parseInt(selectedCategory));
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'productName':
          aValue = a.product.name.toLowerCase();
          bValue = b.product.name.toLowerCase();
          break;
        case 'category':
          aValue = a.product.category.name.toLowerCase();
          bValue = b.product.category.name.toLowerCase();
          break;
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case 'minStock':
          aValue = a.minStock;
          bValue = b.minStock;
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
          break;
        default:
          aValue = a.product.name.toLowerCase();
          bValue = b.product.name.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredStockItems(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('');
    setSelectedCategory('');
    setSortBy('productName');
    setSortOrder('asc');
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? 
      <ArrowUpIcon className="w-4 h-4" /> : 
      <ArrowDownIcon className="w-4 h-4" />;
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const openAdjustModal = (stockItem) => {
    setSelectedStock(stockItem);
    reset({
      quantity: '',
      note: '',
      type: 'ADD'
    });
    setShowAdjustModal(true);
  };

  const closeAdjustModal = () => {
    setShowAdjustModal(false);
    setSelectedStock(null);
    reset();
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await axios.post(`/api/stock/${selectedStock.id}/adjust`, {
        quantity: Math.abs(parseInt(data.quantity)),
        note: data.note,
        type: data.type
      });
      
      toast.success('Stock adjusted successfully!');
      fetchStockData();
      closeAdjustModal();
    } catch (error) {
      console.error('Failed to adjust stock:', error);
      toast.error(error.response?.data?.message || 'Failed to adjust stock');
    } finally {
      setSubmitting(false);
    }
  };

  const addStock = async (stockId, quantity, note) => {
    try {
      await axios.post(`/api/stock/${stockId}/adjust`, {
        quantity: parseInt(quantity),
        note: note || 'Stock added',
        type: 'ADD'
      });
      
      toast.success('Stock added successfully!');
      fetchStockData();
    } catch (error) {
      console.error('Failed to add stock:', error);
      toast.error('Failed to add stock');
    }
  };

  const getStockStatus = (quantity, minStock) => {
    if (quantity <= 0) return { status: 'out', color: 'red', text: 'Out of Stock' };
    if (quantity <= minStock) return { status: 'low', color: 'yellow', text: 'Low Stock' };
    return { status: 'good', color: 'green', text: 'In Stock' };
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Stock Management</h1>
        <div className="text-sm text-gray-600">
          {stockItems.filter(item => item.quantity <= item.minStock && item.quantity > 0).length} items need restocking
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Search & Filters</h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <FunnelIcon className="w-5 h-5" />
              <span>Filters</span>
            </button>
          </div>
          
          {/* Search Bar */}
          <div className="mt-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products or categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Status</option>
                  <option value="good">In Stock</option>
                  <option value="low">Low Stock</option>
                  <option value="out">Out of Stock</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="productName">Product Name</option>
                  <option value="category">Category</option>
                  <option value="quantity">Quantity</option>
                  <option value="minStock">Min Stock</option>
                  <option value="updatedAt">Last Updated</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                <button
                  type="button"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 flex items-center justify-between"
                >
                  <span>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
                  {sortOrder === 'asc' ? 
                    <ArrowUpIcon className="w-4 h-4" /> : 
                    <ArrowDownIcon className="w-4 h-4" />
                  }
                </button>
              </div>
            </div>
          )}

          {/* Clear Filters */}
          {(searchTerm || selectedStatus || selectedCategory || sortBy !== 'productName' || sortOrder !== 'asc') && (
            <div className="mt-4">
              <button
                onClick={clearFilters}
                className="text-sm text-gray-600 hover:text-gray-900 underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stock Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-blue-100">
              <span className="text-2xl">📦</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-semibold text-gray-900">{stockItems.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-yellow-100">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stockItems.filter(item => item.quantity <= item.minStock && item.quantity > 0).length}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-red-100">
              <span className="text-2xl">🚫</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Out of Stock</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stockItems.filter(item => item.quantity <= 0).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Items Table */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Drink Inventory</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('productName')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Product</span>
                    {getSortIcon('productName')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('quantity')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Current Stock</span>
                    {getSortIcon('quantity')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('minStock')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Min Stock</span>
                    {getSortIcon('minStock')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('updatedAt')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Last Updated</span>
                    {getSortIcon('updatedAt')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStockItems.length > 0 ? (
                filteredStockItems.map((item) => {
                  const status = getStockStatus(item.quantity, item.minStock);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.product.name}</div>
                          <div className="text-sm text-gray-500">{item.product.category.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.minStock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${status.color}-100 text-${status.color}-800`}>
                          {status.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(item.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => addStock(item.id, 10, 'Quick restock')}
                            className="text-green-600 hover:text-green-900"
                          >
                            +10
                          </button>
                          <button
                            onClick={() => openAdjustModal(item)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Adjust
                          </button>
                          <button
                            onClick={() => {
                              setSelectedStock(item);
                              setShowLogsModal(true);
                            }}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            History
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <div className="text-lg font-medium mb-2">No stock items found</div>
                      <div className="text-sm">
                        {searchTerm || selectedStatus || selectedCategory 
                          ? 'Try adjusting your search or filters'
                          : 'No stock items available. Add products to start managing inventory.'
                        }
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {showAdjustModal && selectedStock && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Adjust Stock - {selectedStock.product.name}
                </h3>
                <button
                  onClick={closeAdjustModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Stock: {selectedStock.quantity}
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Operation Type *
                  </label>
                  <select
                    {...register('type')}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.type ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="ADD">Add Stock</option>
                    <option value="REMOVE">Remove Stock</option>
                    <option value="ADJUST">Set Exact Quantity</option>
                  </select>
                  {errors.type && (
                    <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity *
                  </label>
                  <input
                    {...register('quantity')}
                    type="number"
                    min="0"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.quantity ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter quantity"
                  />
                  {errors.quantity && (
                    <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note
                  </label>
                  <textarea
                    {...register('note')}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Reason for adjustment"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeAdjustModal}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Adjusting...
                      </div>
                    ) : (
                      'Adjust Stock'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Stock History Modal */}
      {showLogsModal && selectedStock && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Stock History - {selectedStock.product.name}
                </h3>
                <button
                  onClick={() => setShowLogsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {stockLogs
                  .filter(log => log.stock.productId === selectedStock.productId)
                  .map((log) => (
                    <div key={log.id} className="border-b pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">
                            {log.type === 'ADD' ? 'Stock Added' : 
                             log.type === 'REMOVE' ? 'Stock Removed' : 'Stock Adjusted'}
                          </p>
                          <p className="text-sm text-gray-600">{log.note}</p>
                          <p className="text-xs text-gray-500">
                            by {log.user.name} on {new Date(log.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <span className={`text-sm font-medium ${
                          log.type === 'ADD' ? 'text-green-600' : 
                          log.type === 'REMOVE' ? 'text-red-600' : 'text-blue-600'
                        }`}>
                          {log.type === 'ADD' ? '+' : ''}{log.quantity}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stock; 