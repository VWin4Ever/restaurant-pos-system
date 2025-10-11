import React, { useState, useEffect } from 'react';

import axios from 'axios';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';
import ConfirmDialog from '../common/ConfirmDialog';
import { MagnifyingGlassIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';



const Products = () => {
  const { hasPermission } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false });
  const [selectedImages, setSelectedImages] = useState([]);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkProducts, setBulkProducts] = useState([{ name: '', price: '', costPrice: '', categoryId: '', needStock: false, description: '', image: null }]);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Quick filter state - synchronized with selectedStatus
  const [quickFilter, setQuickFilter] = useState('');

  // Statistics states
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    needStock: 0,
    noStock: 0
  });




  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Synchronize selectedStatus with quickFilter
  useEffect(() => {
    if (selectedStatus === 'active' || selectedStatus === 'inactive') {
      setQuickFilter(selectedStatus);
    } else if (selectedStatus === '') {
      // Only clear quickFilter if it's a status-related filter
      if (quickFilter === 'active' || quickFilter === 'inactive') {
        setQuickFilter('');
      }
    }
  }, [selectedStatus]);


  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes, statsRes] = await Promise.all([
        axios.get('/api/products'),
        axios.get('/api/categories'),
        axios.get('/api/products/stats')
      ]);
      
      setProducts(productsRes.data.data);
      setCategories(categoriesRes.data.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Local filtering logic (like Tables component)
  const filteredProducts = products.filter(product => {
    // Quick filter logic
    let matchesQuickFilter = true;
    if (quickFilter === 'active') {
      matchesQuickFilter = product.isActive;
    } else if (quickFilter === 'inactive') {
      matchesQuickFilter = !product.isActive;
    } else if (quickFilter === 'drinks') {
      matchesQuickFilter = product.needStock;
    } else if (quickFilter === 'food') {
      matchesQuickFilter = !product.needStock;
    }
    
    // Search filter
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category filter
    const matchesCategory = !selectedCategory || product.categoryId === parseInt(selectedCategory);
    
    
    // Status filter
    const matchesStatus = !selectedStatus || 
      (selectedStatus === 'active' && product.isActive) ||
      (selectedStatus === 'inactive' && !product.isActive);
    
    // Price range filter
    const matchesPrice = (!minPrice || product.price >= parseFloat(minPrice)) &&
                         (!maxPrice || product.price <= parseFloat(maxPrice));
    
    return matchesQuickFilter && matchesSearch && matchesCategory && matchesStatus && matchesPrice;
  }).sort((a, b) => {
    // Local sorting
    let aValue, bValue;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'price':
        aValue = parseFloat(a.price);
        bValue = parseFloat(b.price);
        break;
      case 'productId':
        aValue = a.productId;
        bValue = b.productId;
        break;
      case 'costPrice':
        aValue = parseFloat(a.costPrice);
        bValue = parseFloat(b.costPrice);
        break;
      case 'category':
        aValue = a.category?.name || '';
        bValue = b.category?.name || '';
        break;
      default:
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });



  

  

 

 

  



  // Bulk add functions
  const addBulkProductRow = () => {
    setBulkProducts([...bulkProducts, { name: '', price: '', costPrice: '', categoryId: '', needStock: false, description: '', image: null }]);
  };

  const removeBulkProductRow = (index) => {
    if (bulkProducts.length > 1) {
      const newProducts = bulkProducts.filter((_, i) => i !== index);
      setBulkProducts(newProducts);
    }
  };

  const updateBulkProduct = (index, field, value) => {
    const newProducts = [...bulkProducts];
    newProducts[index] = { ...newProducts[index], [field]: value };
    setBulkProducts(newProducts);
  };

  const handleBulkImageChange = (index, event) => {
    const file = event.target.files[0];
    if (file) {
      const newProducts = [...bulkProducts];
      newProducts[index] = { ...newProducts[index], image: file };
      setBulkProducts(newProducts);
    }
  };

  const removeBulkImage = (index) => {
    const newProducts = [...bulkProducts];
    newProducts[index] = { ...newProducts[index], image: null };
    setBulkProducts(newProducts);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setBulkProducts([{
      name: product.name,
      price: product.price.toString(),
      costPrice: product.costPrice.toString(),
      categoryId: product.categoryId.toString(),
      needStock: product.needStock,
      description: product.description || '',
      image: null
    }]);
    setShowBulkAdd(true);
  };

  const closeModal = () => {
    setShowBulkAdd(false);
    setEditingProduct(null);
    setBulkProducts([{ name: '', price: '', costPrice: '', categoryId: '', needStock: false, description: '', image: null }]);
  };

  const submitBulkProducts = async () => {
    try {
      setSubmitting(true);
      const validProducts = bulkProducts.filter(p => p.name && p.price && p.costPrice && p.categoryId);
      
      if (validProducts.length === 0) {
        toast.error('Please fill in at least one complete product');
        return;
      }
      
      // If editing a single product
      if (editingProduct && validProducts.length === 1) {
        const product = validProducts[0];
        
        // Check for duplicate names (excluding current product)
        const existingNames = products.filter(p => p.id !== editingProduct.id).map(p => p.name.toLowerCase());
        if (existingNames.includes(product.name.trim().toLowerCase())) {
          toast.error(`Product with name "${product.name}" already exists`);
          setSubmitting(false);
          return;
        }

      const formData = new FormData();
        formData.append('name', product.name);
        formData.append('price', parseFloat(product.price));
        formData.append('costPrice', parseFloat(product.costPrice));
        formData.append('categoryId', parseInt(product.categoryId));
        formData.append('needStock', product.needStock);
        formData.append('description', product.description || '');
        
        if (product.image) {
          formData.append('image', product.image);
        }

        await axios.put(`/api/products/${editingProduct.id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        toast.success('Product updated successfully!');
        closeModal();
        fetchData();
        return;
      }
      
      // Check for duplicate names within the bulk operation
      const names = validProducts.map(p => p.name.trim().toLowerCase());
      const duplicateNames = names.filter((name, index) => names.indexOf(name) !== index);
      if (duplicateNames.length > 0) {
        toast.error(`Duplicate names found: ${[...new Set(duplicateNames)].join(', ')}`);
        setSubmitting(false);
        return;
      }
      
      // Check for existing product names
      const existingNames = products.map(p => p.name.toLowerCase());
      const conflictingNames = validProducts.filter(p => 
        existingNames.includes(p.name.trim().toLowerCase())
      );
      if (conflictingNames.length > 0) {
        toast.error(`Products with these names already exist: ${conflictingNames.map(p => p.name).join(', ')}`);
        setSubmitting(false);
        return;
      }

      const promises = validProducts.map(async (product) => {
        const formData = new FormData();
        formData.append('name', product.name);
        formData.append('price', parseFloat(product.price));
        formData.append('costPrice', parseFloat(product.costPrice));
        formData.append('categoryId', parseInt(product.categoryId));
        formData.append('needStock', product.needStock);
        formData.append('description', product.description || '');
        
        if (product.image) {
          formData.append('image', product.image);
        }

        console.log('Sending product:', {
          name: product.name,
          price: parseFloat(product.price),
          costPrice: parseFloat(product.costPrice),
          categoryId: parseInt(product.categoryId),
          needStock: product.needStock,
          description: product.description || '',
          hasImage: !!product.image
        });

        return axios.post('/api/products', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      });

      await Promise.all(promises);
      
      toast.success(`Successfully added ${validProducts.length} products!`);
      closeModal();
      fetchData();
    } catch (error) {
      console.error('Bulk add error:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to add products';
      toast.error(errorMessage);
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
        const category = categories.find(c => c.id === selectedCategory);
        filename += `-${category?.name || selectedCategory}`;
      }
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


  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedStatus('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('name');
    setSortOrder('asc');
    setQuickFilter('');
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

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-gradient p-4 sm:p-6 animate-slide-down sticky top-0 z-30 bg-white shadow">
        {/* Status Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Total Products */}
          <div className="p-6 rounded-xl shadow-lg text-white" style={{background: 'linear-gradient(to right, #53B312, #4A9F0F)'}}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Products</p>
                <p className="text-3xl font-bold">{filteredProducts.length}</p>
              </div>
              <div className="text-4xl">📦</div>
            </div>
          </div>
          {/* Active */}
          <button 
            onClick={() => {
              const newFilter = quickFilter === 'active' ? '' : 'active';
              setQuickFilter(newFilter);
              setSelectedStatus(newFilter);
            }}
            className={`bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white hover:from-green-600 hover:to-green-700 hover:shadow-xl transition-all duration-200 hover:scale-105 focus:ring-4 focus:ring-green-300 focus:outline-none ${
              quickFilter === 'active' ? 'ring-4 ring-green-300 scale-105' : ''
            }`}
            title={quickFilter === 'active' ? 'Click to show all products' : 'Click to filter and show only Active products'}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Active</p>
                <p className="text-3xl font-bold">{filteredProducts.filter(p => p.isActive).length}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </button>
          {/* Inactive */}
          <button 
            onClick={() => {
              const newFilter = quickFilter === 'inactive' ? '' : 'inactive';
              setQuickFilter(newFilter);
              setSelectedStatus(newFilter);
            }}
            className={`bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-xl shadow-lg text-white hover:from-red-600 hover:to-red-700 hover:shadow-xl transition-all duration-200 hover:scale-105 focus:ring-4 focus:ring-red-300 focus:outline-none ${
              quickFilter === 'inactive' ? 'ring-4 ring-red-300 scale-105' : ''
            }`}
            title={quickFilter === 'inactive' ? 'Click to show all products' : 'Click to filter and show only Inactive products'}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Inactive</p>
                <p className="text-3xl font-bold">{filteredProducts.filter(p => !p.isActive).length}</p>
              </div>
              <div className="text-4xl">❌</div>
            </div>
          </button>
          {/* Drinks */}
          <button 
            onClick={() => setQuickFilter(quickFilter === 'drinks' ? '' : 'drinks')}
            className={`bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white hover:from-purple-600 hover:to-purple-700 hover:shadow-xl transition-all duration-200 hover:scale-105 focus:ring-4 focus:ring-purple-300 focus:outline-none ${
              quickFilter === 'drinks' ? 'ring-4 ring-purple-300 scale-105' : ''
            }`}
            title={quickFilter === 'drinks' ? 'Click to show all products' : 'Click to filter and show only products with stock tracking'}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">With Stock</p>
                <p className="text-3xl font-bold">{filteredProducts.filter(p => p.needStock).length}</p>
              </div>
              <div className="text-4xl">📦</div>
            </div>
          </button>
          {/* Food */}
          <button 
            onClick={() => setQuickFilter(quickFilter === 'food' ? '' : 'food')}
            className={`bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg text-white hover:from-orange-600 hover:to-orange-700 hover:shadow-xl transition-all duration-200 hover:scale-105 focus:ring-4 focus:ring-orange-300 focus:outline-none ${
              quickFilter === 'food' ? 'ring-4 ring-orange-300 scale-105' : ''
            }`}
            title={quickFilter === 'food' ? 'Click to show all products' : 'Click to filter and show only products without stock tracking'}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Without Stock</p>
                <p className="text-3xl font-bold">{filteredProducts.filter(p => !p.needStock).length}</p>
              </div>
              <div className="text-4xl">🍽️</div>
            </div>
          </button>
        </div>
        
        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row justify-end items-center gap-3 sm:gap-6 w-full">
          {hasPermission('products.read') && (
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
              <div className="flex space-x-2">

            <button
                  onClick={() => setShowBulkAdd(true)}
              className="btn-primary"
            >
                  Add Products
            </button>
              </div>
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
          {(searchTerm || selectedCategory || selectedStatus || minPrice || maxPrice || quickFilter) && (
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
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('productId')}
                >
                  <div className="flex items-center space-x-1">
                    <span>ID</span>
                    {getSortIcon('productId')}
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
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('costPrice')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Cost Price</span>
                    {getSortIcon('costPrice')}
                  </div>
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
              {filteredProducts.map((product) => (
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
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {product.productId || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.category.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${parseFloat(product.price).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${parseFloat(product.costPrice).toFixed(2)}
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
                      {hasPermission('products.update') && (
                        <button
                          onClick={() => openEditModal(product)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Edit
                        </button>
                      )}
                      {hasPermission('products.update') && (
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
                          className={`${
                            product._count?.orderItems > 0
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-red-600 hover:text-red-900'
                          }`}
                          disabled={product._count?.orderItems > 0}
                          title={product._count?.orderItems > 0 
                            ? `Cannot delete product with ${product._count.orderItems} order(s)` 
                            : 'Delete product'
                          }
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
          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || selectedCategory || selectedStatus || minPrice || maxPrice || quickFilter
                  ? 'Try adjusting your filters to find what you\'re looking for.'
                  : 'Get started by creating your first product.'}
              </p>
              {!searchTerm && !selectedCategory && !selectedStatus && !minPrice && !maxPrice && !quickFilter && hasPermission('products.create') && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowBulkAdd(true)}
                    className="btn-primary"
                  >
                    Add Products
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results Summary */}
          <div className="px-6 py-4 border-t border-gray-200">
              <div className="text-sm text-gray-700">
            Showing {filteredProducts.length} of {products.length} products
              </div>
              </div>
      </div>

      {/* Add/Edit Product Modal */}
     


      {/* Bulk Add Modal */}
      {showBulkAdd && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingProduct ? 'Edit Product' : 'Add Products'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    {editingProduct ? 'Edit product details' : 'Add multiple products at once'}
                  </p>
                  {!editingProduct && (
                    <button
                      onClick={addBulkProductRow}
                      className="btn-secondary text-sm"
                    >
                      + Add Row
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name *</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price *</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cost Price *</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category *</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">With Stock</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bulkProducts.map((product, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={product.name}
                              onChange={(e) => updateBulkProduct(index, 'name', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="Product name"
                            />
                          </td>
                          <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.01"
                              value={product.price}
                              onChange={(e) => updateBulkProduct(index, 'price', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="0.00"
                    />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="0.01"
                              value={product.costPrice}
                              onChange={(e) => updateBulkProduct(index, 'costPrice', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="px-3 py-2">
                    <select
                              value={product.categoryId}
                              onChange={(e) => updateBulkProduct(index, 'categoryId', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                              <option value="">Select</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={product.needStock}
                              onChange={(e) => updateBulkProduct(index, 'needStock', e.target.checked)}
                              className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                              title="Check if this product has stock tracking"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <div className="space-y-2">
                              {product.image ? (
                                <div className="flex items-center space-x-2">
                                  <img
                                    src={URL.createObjectURL(product.image)}
                                    alt="Preview"
                                    className="w-8 h-8 object-cover rounded"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeBulkImage(index)}
                                    className="text-red-600 hover:text-red-800 text-xs"
                                  >
                                    Remove
                                  </button>
                  </div>
                              ) : (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                                    onChange={(e) => handleBulkImageChange(index, e)}
                                    className="w-full text-xs"
                                  />
                                  <p className="text-xs text-gray-500 mt-1">Optional</p>
                    </div>
                  )}
                </div>
                          </td>
                          <td className="px-3 py-2">
                  <input
                              type="text"
                              value={product.description}
                              onChange={(e) => updateBulkProduct(index, 'description', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="Description"
                            />
                          </td>
                          <td className="px-3 py-2">
                            {!editingProduct && bulkProducts.length > 1 && (
                              <button
                                onClick={() => removeBulkProductRow(index)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Remove
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                    onClick={submitBulkProducts}
                    disabled={submitting}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Adding...
                      </div>
                    ) : (() => {
                      if (editingProduct) {
                        return 'Update Product';
                      }
                      const validCount = bulkProducts.filter(p => p.name && p.price && p.costPrice && p.categoryId).length;
                      return validCount === 1 ? 'Add Product' : `Add ${validCount} Products`;
                    })()}
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