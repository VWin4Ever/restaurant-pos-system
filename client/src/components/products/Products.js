import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from 'axios';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';
import ConfirmDialog from '../common/ConfirmDialog';
import { MagnifyingGlassIcon, FunnelIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

const schema = yup.object({
  name: yup.string().required('Product name is required'),
  description: yup.string().optional(),
  price: yup.number().positive('Price must be positive').required('Price is required'),
  categoryId: yup.number().nullable().required('Category is required'),
  isDrink: yup.boolean().default(false)
}).required();

const Products = () => {
  const { hasPermission } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false });
  const [imagePreview, setImagePreview] = useState(null);

  // Statistics states
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    drinks: 0
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema)
  });

  useEffect(() => {
    fetchData();
  }, [searchTerm, selectedCategory, selectedType, selectedStatus, minPrice, maxPrice, sortBy, sortOrder, currentPage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 50, // Increased from 20 to 50 to show more products per page
        sortBy,
        sortOrder
      });

      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('categoryId', selectedCategory);
      if (selectedType) params.append('isDrink', selectedType === 'drink');
      if (selectedStatus) params.append('status', selectedStatus);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);

      const [productsRes, categoriesRes, statsRes] = await Promise.all([
        axios.get(`/api/products?${params}`),
        axios.get('/api/categories'),
        axios.get('/api/products/stats')
      ]);
      
      setProducts(productsRes.data.data);
      setTotalPages(productsRes.data.pagination.pages);
      setCategories(categoriesRes.data.data);

      // Use accurate statistics from the stats endpoint
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (product = null) => {
    setEditingProduct(product);
    setImagePreview(null);
    if (product) {
      reset({
        name: product.name,
        description: product.description || '',
        price: product.price,
        categoryId: product.categoryId,
        isDrink: product.isDrink
      });
    } else {
      reset({
        name: '',
        description: '',
        price: '',
        categoryId: null,
        isDrink: false
      });
    }
    setShowModal(true);
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    reset();
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description || '');
      formData.append('price', parseFloat(data.price));
      formData.append('categoryId', parseInt(data.categoryId));
      formData.append('isDrink', Boolean(data.isDrink));

      // Handle image file
      const imageFile = document.getElementById('imageFile').files[0];
      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (editingProduct) {
        await axios.put(`/api/products/${editingProduct.id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success('Product updated successfully!');
      } else {
        await axios.post('/api/products', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success('Product created successfully!');
      }
      fetchData();
      closeModal();
    } catch (error) {
      console.error('Failed to save product:', error);
      console.error('Server response:', JSON.stringify(error.response?.data, null, 2));
      console.error('Validation errors:', JSON.stringify(error.response?.data?.errors, null, 2));
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach((err, index) => {
          console.error(`Error ${index + 1}:`, JSON.stringify(err, null, 2));
        });
      }
      toast.error(error.response?.data?.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const showConfirm = ({ title, message, confirmText, cancelText, icon, type = 'warning' }) => {
    return new Promise((resolve) => {
      setConfirmDialog({
        open: true,
        title,
        message,
        confirmText,
        cancelText,
        icon,
        type,
        onConfirm: () => {
          setConfirmDialog({ open: false });
          resolve(true);
        },
        onCancel: () => {
          setConfirmDialog({ open: false });
          resolve(false);
        }
      });
    });
  };

  const handleDelete = async (productId) => {
    const confirmed = await showConfirm({
      title: 'Delete Product',
      message: 'Are you sure you want to delete this product? This action cannot be undone. Note: Products with existing orders cannot be deleted.',
      confirmText: 'Yes, Delete',
      cancelText: 'No',
      type: 'danger'
    });
    if (!confirmed) return;

    try {
      console.log('Sending delete request for product ID:', productId);
      const response = await axios.delete(`/api/products/${productId}`);
      console.log('Delete response:', response.data);
      toast.success('Product deleted successfully!');
      fetchData();
    } catch (error) {
      console.error('Failed to delete product:', error);
      console.error('Delete error response:', error.response?.data);
      
      // Show specific error message if product has orders
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to delete product');
      }
    }
  };

  const toggleActive = async (productId, currentStatus) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    const confirmed = await showConfirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Product`,
      message: `Are you sure you want to ${action} this product?`,
      confirmText: `Yes, ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      cancelText: 'No',
      type: currentStatus ? 'warning' : 'success'
    });
    if (!confirmed) return;

    try {
      await axios.patch(`/api/products/${productId}`, {
        isActive: !currentStatus
      });
      toast.success(`Product ${action}d successfully!`);
      fetchData();
    } catch (error) {
      console.error('Failed to toggle product status:', error);
      toast.error('Failed to update product status');
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('categoryId', selectedCategory);
      if (selectedType) params.append('isDrink', selectedType === 'drink');
      if (selectedStatus) params.append('status', selectedStatus);

      // Show loading toast
      const loadingToast = toast.loading('Preparing export...');

      const response = await axios.get(`/api/products/export/csv?${params}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with filters
      let filename = 'products';
      if (selectedCategory) {
        const category = categories.find(c => c.id == selectedCategory);
        filename += `-${category?.name || selectedCategory}`;
      }
      if (selectedType) filename += `-${selectedType}`;
      if (selectedStatus) filename += `-${selectedStatus}`;
      filename += '.csv';
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.dismiss(loadingToast);
      toast.success('Products exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export products');
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setImporting(true);
      const formData = new FormData();
      formData.append('file', file);

      // Read CSV file and parse
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const products = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const product = {};
        
        headers.forEach((header, index) => {
          product[header] = values[index];
        });
        
        products.push(product);
      }

      const response = await axios.post('/api/products/import/csv', { products });
      
      if (response.data.data.errors.length > 0) {
        toast.warning(`Import completed with ${response.data.data.errors.length} errors`);
        console.log('Import errors:', response.data.data.errors);
      } else {
        toast.success('Products imported successfully!');
      }
      
      fetchData();
      setShowImportModal(false);
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Failed to import products');
    } finally {
      setImporting(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedType('');
    setSelectedStatus('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('name');
    setSortOrder('asc');
    setCurrentPage(1);
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
    setCurrentPage(1);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-gradient p-4 sm:p-6 animate-slide-down sticky top-0 z-30 bg-white shadow">
        {/* Status Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Total Products */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Products</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <div className="text-4xl">📦</div>
            </div>
          </div>
          {/* Active */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Active</p>
                <p className="text-3xl font-bold">{stats.active}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>
          {/* Inactive */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Inactive</p>
                <p className="text-3xl font-bold">{stats.inactive}</p>
              </div>
              <div className="text-4xl">❌</div>
            </div>
          </div>
          {/* Drinks */}
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Drinks</p>
                <p className="text-3xl font-bold">{stats.drinks}</p>
              </div>
              <div className="text-4xl">🥤</div>
            </div>
          </div>
        </div>
        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row justify-end items-center gap-3 sm:gap-6 w-full">
          {hasPermission('products.import') && (
            <button
              onClick={() => setShowImportModal(true)}
              className="btn-secondary"
            >
              Import
            </button>
          )}
          {hasPermission('products.export') && (
            <button
              onClick={handleExport}
              className="btn-secondary"
            >
              Export
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary"
          >
            Filters
          </button>
          {hasPermission('products.create') && (
            <button
              onClick={() => openModal()}
              className="btn-primary"
            >
              Add Product
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      {showFilters && (
        <div className="card-gradient p-4">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Types</option>
                <option value="food">Food</option>
                <option value="drink">Drink</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="">All</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Clear Filters */}
          {(searchTerm || selectedCategory || selectedType || selectedStatus || minPrice || maxPrice) && (
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
      )}

      {/* Products Table */}
      <div className="card-gradient">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Menu Items</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Product</span>
                    {getSortIcon('name')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Price</span>
                    {getSortIcon('price')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded-md"
                        onError={(e) => {
                          if (e.target && e.target.style) {
                            e.target.style.display = 'none';
                          }
                          if (e.target && e.target.nextSibling && e.target.nextSibling.style) {
                            e.target.nextSibling.style.display = 'block';
                          }
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
                        <span className="text-gray-500 text-xs">No Image</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      {product.description && (
                        <div className="text-sm text-gray-500">{product.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.category.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${parseFloat(product.price).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.isDrink 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {product.isDrink ? 'Drink' : 'Food'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {hasPermission('products.edit') && (
                        <button
                          onClick={() => openModal(product)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Edit
                        </button>
                      )}
                      {hasPermission('products.edit') && (
                        <button
                          onClick={() => toggleActive(product.id, product.isActive)}
                          className={`${
                            product.isActive 
                              ? 'text-yellow-600 hover:text-yellow-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {product.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                      {hasPermission('products.delete') && (
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Empty State */}
          {products.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || selectedCategory || selectedType || selectedStatus || minPrice || maxPrice
                  ? 'Try adjusting your filters to find what you\'re looking for.'
                  : 'Get started by creating your first product.'}
              </p>
              {!searchTerm && !selectedCategory && !selectedType && !selectedStatus && !minPrice && !maxPrice && hasPermission('products.create') && (
                <div className="mt-6">
                  <button
                    onClick={() => openModal()}
                    className="btn-primary"
                  >
                    Add Product
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages} • Showing {products.length} of {stats.total} products
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
                <button
                  onClick={() => {
                    // Show all products by setting a very high limit
                    const params = new URLSearchParams({
                      page: 1,
                      limit: 1000, // Show all products
                      sortBy,
                      sortOrder
                    });
                    if (searchTerm) params.append('search', searchTerm);
                    if (selectedCategory) params.append('categoryId', selectedCategory);
                    if (selectedType) params.append('isDrink', selectedType === 'drink');
                    if (selectedStatus) params.append('status', selectedStatus);
                    if (minPrice) params.append('minPrice', minPrice);
                    if (maxPrice) params.append('maxPrice', maxPrice);
                    
                    axios.get(`/api/products?${params}`).then(response => {
                      setProducts(response.data.data);
                      setTotalPages(1);
                      setCurrentPage(1);
                    });
                  }}
                  className="px-3 py-1 text-sm bg-blue-500 text-white border border-blue-500 rounded-md hover:bg-blue-600"
                >
                  Show All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter product name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    {...register('description')}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter product description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price *
                    </label>
                    <input
                      {...register('price')}
                      type="number"
                      step="0.01"
                      min="0"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.price ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                    />
                    {errors.price && (
                      <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      {...register('categoryId')}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.categoryId ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {errors.categoryId && (
                      <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Image
                  </label>
                  <input
                    type="file"
                    id="imageFile"
                    accept="image/*"
                    onChange={handleImageChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.imageUrl ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Accepted formats: JPG, PNG, GIF. Max size: 5MB
                  </p>
                  
                  {/* Image Preview */}
                  {(imagePreview || (editingProduct && editingProduct.imageUrl)) && (
                    <div className="mt-3">
                      <img
                        src={imagePreview || editingProduct.imageUrl}
                        alt="Product preview"
                        className="w-32 h-32 object-cover rounded-md border"
                      />
                    </div>
                  )}
                  
                  {errors.imageUrl && (
                    <p className="mt-1 text-sm text-red-600">{errors.imageUrl.message}</p>
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    {...register('isDrink')}
                    type="checkbox"
                    id="isDrink"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isDrink" className="ml-2 block text-sm text-gray-900">
                    This is a drink
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
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
                        Saving...
                      </div>
                    ) : (
                      editingProduct ? 'Update Product' : 'Create Product'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-background rounded-2xl shadow-large p-6 max-w-md w-full mx-4">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Import Products</h3>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CSV File
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleImport}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">CSV Format:</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Required columns:</strong> name, price, categoryId<br/>
                    <strong>Optional columns:</strong> description, isDrink, imageUrl
                  </p>
                  <p className="text-sm text-gray-500">
                    Example: name,price,categoryId,description,isDrink<br/>
                    "Pizza Margherita",12.99,1,"Classic tomato and mozzarella",false
                  </p>
                </div>

                {importing && (
                  <div className="flex items-center justify-center py-4">
                    <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span className="text-sm text-gray-600">Importing products...</span>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="btn-secondary"
                    disabled={importing}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDialog.open && (
        <ConfirmDialog {...confirmDialog} />
      )}
    </div>
  );
};

export default Products; 