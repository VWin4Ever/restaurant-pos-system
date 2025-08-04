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
  name: yup.string().required('Category name is required'),
  description: yup.string().optional()
}).required();

const Categories = () => {
  const { hasPermission } = useAuth();
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedProductFilter, setSelectedProductFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema)
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [categories, searchTerm, selectedStatus, selectedProductFilter, sortBy, sortOrder]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories?includeInactive=true');
      setCategories(response.data.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...categories];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (selectedStatus === 'active') {
      filtered = filtered.filter(category => category.isActive);
    } else if (selectedStatus === 'inactive') {
      filtered = filtered.filter(category => !category.isActive);
    }

    // Product count filter
    if (selectedProductFilter === 'with_products') {
      filtered = filtered.filter(category => (category._count?.products || 0) > 0);
    } else if (selectedProductFilter === 'without_products') {
      filtered = filtered.filter(category => (category._count?.products || 0) === 0);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'products':
          aValue = a._count?.products || 0;
          bValue = b._count?.products || 0;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
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

    setFilteredCategories(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('');
    setSelectedProductFilter('');
    setSortBy('name');
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

  const openModal = (category = null) => {
    setEditingCategory(category);
    if (category) {
      reset({
        name: category.name,
        description: category.description || ''
      });
    } else {
      reset({
        name: '',
        description: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    reset();
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (editingCategory) {
        await axios.put(`/api/categories/${editingCategory.id}`, data);
        toast.success('Category updated successfully!');
      } else {
        await axios.post('/api/categories', data);
        toast.success('Category created successfully!');
      }
      fetchCategories();
      closeModal();
    } catch (error) {
      console.error('Failed to save category:', error);
      console.error('Server response:', error.response?.data);
      
      // Show specific error messages
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.status === 400) {
        toast.error('Invalid data provided');
      } else if (error.response?.status === 404) {
        toast.error('Category not found');
      } else {
        toast.error('Failed to save category');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (categoryId) => {
    const confirmed = await showConfirm({
      title: 'Delete Category',
      message: 'Are you sure you want to permanently delete this category? This action cannot be undone and the category will be completely removed from the system.',
      confirmText: 'Yes, Delete Permanently',
      cancelText: 'No, Keep Category',
      type: 'danger'
    });
    if (!confirmed) return;

    try {
      await axios.delete(`/api/categories/${categoryId}`);
      toast.success('Category deleted successfully!');
      fetchCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
      console.error('Server response:', error.response?.data);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to delete category');
      }
    }
  };

  const toggleActive = async (categoryId, currentStatus) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    const confirmed = await showConfirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Category`,
      message: `Are you sure you want to ${action} this category?`,
      confirmText: `Yes, ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      cancelText: 'No',
      type: currentStatus ? 'warning' : 'success'
    });
    if (!confirmed) return;

    try {
      await axios.patch(`/api/categories/${categoryId}`, {
        isActive: !currentStatus
      });
      toast.success(`Category ${action}d successfully!`);
      fetchCategories();
    } catch (error) {
      console.error('Failed to toggle category status:', error);
      console.error('Server response:', error.response?.data);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to update category status');
      }
    }
  };

  // Calculate statistics
  const stats = {
    total: filteredCategories.length,
    active: filteredCategories.filter(cat => cat.isActive).length,
    inactive: filteredCategories.filter(cat => !cat.isActive).length,
    totalProducts: filteredCategories.reduce((total, cat) => total + (cat._count?.products || 0), 0)
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
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 rounded-lg bg-blue-100">
                <span className="text-xl">📂</span>
              </div>
              <div className="ml-3">
                <div className="text-lg sm:text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm sm:text-base text-gray-500 mt-1">Total Categories</div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 rounded-lg bg-green-100">
                <span className="text-xl">✅</span>
              </div>
              <div className="ml-3">
                <div className="text-lg sm:text-2xl font-bold text-gray-900">{stats.active}</div>
                <div className="text-sm sm:text-base text-gray-500 mt-1">Active</div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 rounded-lg bg-red-100">
                <span className="text-xl">❌</span>
              </div>
              <div className="ml-3">
                <div className="text-lg sm:text-2xl font-bold text-gray-900">{stats.inactive}</div>
                <div className="text-sm sm:text-base text-gray-500 mt-1">Inactive</div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 rounded-lg bg-purple-100">
                <span className="text-xl">🍽️</span>
              </div>
              <div className="ml-3">
                <div className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalProducts}</div>
                <div className="text-sm sm:text-base text-gray-500 mt-1">Total Products</div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row justify-end items-center gap-3 sm:gap-6 w-full">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary"
          >
            Filters
          </button>
          {hasPermission('categories.create') && (
            <button
              onClick={() => openModal()}
              className="btn-primary"
            >
              Add Category
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
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Products</label>
              <select
                value={selectedProductFilter}
                onChange={(e) => setSelectedProductFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Categories</option>
                <option value="with_products">With Products</option>
                <option value="without_products">Without Products</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="name">Name</option>
                <option value="products">Product Count</option>
                <option value="createdAt">Created Date</option>
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

          {/* Clear Filters */}
          {(searchTerm || selectedStatus || selectedProductFilter || sortBy !== 'name' || sortOrder !== 'asc') && (
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

      {/* Categories Table */}
      <div className="card-gradient">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Menu Categories</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Category Name</span>
                    {getSortIcon('name')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('products')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Products</span>
                    {getSortIcon('products')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Created</span>
                    {getSortIcon('createdAt')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{category.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {category.description || 'No description'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category._count?.products || 0} products
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        category.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(category.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {hasPermission('categories.edit') && (
                          <button
                            onClick={() => openModal(category)}
                            className={`${
                              category.isActive 
                                ? 'text-primary-600 hover:text-primary-900' 
                                : 'text-gray-400 cursor-not-allowed'
                            }`}
                            disabled={!category.isActive}
                            title={!category.isActive ? 'Cannot edit inactive category' : 'Edit category'}
                          >
                            Edit
                          </button>
                        )}
                        {hasPermission('categories.edit') && (
                          <button
                            onClick={() => toggleActive(category.id, category.isActive)}
                            className={`${
                              category.isActive 
                                ? 'text-yellow-600 hover:text-yellow-900' 
                                : 'text-green-600 hover:text-green-900'
                            }`}
                          >
                            {category.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                        {hasPermission('categories.delete') && (
                          <button
                            onClick={() => handleDelete(category.id)}
                            className={`${
                              category._count?.products > 0
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-red-600 hover:text-red-900'
                            }`}
                            disabled={category._count?.products > 0}
                            title={category._count?.products > 0 
                              ? `Cannot delete category with ${category._count.products} product(s)` 
                              : 'Delete category'
                            }
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <div className="text-4xl mb-4">📂</div>
                      <div className="text-lg font-medium mb-2">No categories found</div>
                      <div className="text-sm">
                        {searchTerm || selectedStatus || selectedProductFilter 
                          ? 'Try adjusting your search or filters'
                          : 'Create your first category to get started'
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

      {/* Add/Edit Category Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-background rounded-2xl shadow-large p-6 max-w-md w-full mx-4">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
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
                    Category Name *
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter category name"
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
                    placeholder="Enter category description"
                  />
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
                      editingCategory ? 'Update Category' : 'Create Category'
                    )}
                  </button>
                </div>
              </form>
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

export default Categories; 