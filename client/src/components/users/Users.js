import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import LoadingSpinner from '../common/LoadingSpinner';
import ConfirmDialog from '../common/ConfirmDialog';
import Icon from '../common/Icon';
import { useAuth } from '../../contexts/AuthContext';

// Skeleton loader for users table
const UsersSkeleton = ({ rows = 5 }) => (
  <div className="space-y-4 p-6">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="animate-pulse bg-surface rounded-xl h-20 w-full" />
    ))}
  </div>
);

const Users = () => {
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ open: false });
  const [isMobile, setIsMobile] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    search: ''
  });
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    role: 'CASHIER'
  });

  // Check mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [filters, pagination.page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      const response = await axios.get(`/api/users?${params}`);
      setUsers(response.data.data);
      
      // Handle both new pagination format and old format for backward compatibility
      if (response.data.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          pages: response.data.pagination.pages
        }));
      } else {
        // Fallback for old API format
        setPagination(prev => ({
          ...prev,
          total: response.data.data.length,
          pages: 1
        }));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    if (!editingUser && formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    if (editingUser && formData.password && formData.password.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }
    
    // Validate email format if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setActionLoading(true);
    
    try {
      if (editingUser) {
        await axios.put(`/api/users/${editingUser.id}`, formData);
        toast.success('User updated successfully');
      } else {
        await axios.post('/api/users', formData);
        toast.success('User created successfully');
      }
      
      setShowModal(false);
      setEditingUser(null);
      resetForm();
      setSelectedUsers([]); // Clear selected users after operation
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error(error.response?.data?.message || 'Failed to save user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      name: user.name,
      email: user.email || '',
      role: user.role
    });
    setShowModal(true);
  };



  const handleDelete = async (userId) => {
    try {
      await axios.delete(`/api/users/${userId}`);
      toast.success('User deleted successfully');
      // Remove from selected users if present
      setSelectedUsers(prev => prev.filter(id => id !== userId));
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleDeleteUser = (user) => {
    // Get current user from auth context
    const currentUser = JSON.parse(localStorage.getItem('user'));
    
    if (currentUser && currentUser.id === user.id) {
      toast.error('You cannot delete your own account');
      return;
    }
    
    setConfirmDialog({
      open: true,
      title: 'Delete User',
      message: `Are you sure you want to delete user "${user.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      icon: 'delete',
      type: 'danger',
      userId: user.id
    });
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedUsers.map(id => axios.delete(`/api/users/${id}`)));
      toast.success(`${selectedUsers.length} users deleted successfully`);
      setSelectedUsers([]);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting users:', error);
      toast.error('Failed to delete some users');
    }
  };

  const handleBulkDeleteUsers = () => {
    setConfirmDialog({
      open: true,
      title: 'Delete Multiple Users',
      message: `Are you sure you want to delete ${selectedUsers.length} selected users? This action cannot be undone.`,
      confirmText: 'Delete All',
      cancelText: 'Cancel',
      icon: 'delete',
      type: 'danger'
    });
  };

  const toggleActive = async (userId, isActive) => {
    try {
      await axios.patch(`/api/users/${userId}/toggle-active`);
      toast.success(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const handleToggleActive = (user) => {
    // Get current user from auth context
    const currentUser = JSON.parse(localStorage.getItem('user'));
    
    if (currentUser && currentUser.id === user.id && user.isActive) {
      toast.error('You cannot deactivate your own account');
      return;
    }
    
    setConfirmDialog({
      open: true,
      title: `${user.isActive ? 'Deactivate' : 'Activate'} User`,
      message: `Are you sure you want to ${user.isActive ? 'deactivate' : 'activate'} user "${user.name}"?`,
      confirmText: user.isActive ? 'Deactivate' : 'Activate',
      cancelText: 'Cancel',
      icon: user.isActive ? 'visibility_off' : 'visibility',
      type: 'warning',
      userId: user.id,
      isActive: user.isActive
    });
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      name: '',
      email: '',
      role: 'CASHIER'
    });
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  };

  const getRoleBadge = (role) => {
    const colors = {
      ADMIN: 'bg-blue-100 text-blue-800 border-blue-200',
      CASHIER: 'bg-green-100 text-green-800 border-green-200'
    };
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${colors[role] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {role}
      </span>
    );
  };

  const getStatusBadge = (isActive) => {
    return (
      <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${
        isActive 
          ? 'bg-green-100 text-green-800 border-green-200' 
          : 'bg-red-100 text-red-800 border-red-200'
      }`}>
        <span className={`w-2 h-2 rounded-full mr-2 ${isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const ActionButton = ({ icon, label, onClick, color = 'primary' }) => (
    <button
      onClick={onClick}
      className={`btn-${color} flex items-center space-x-2 px-3 py-2 text-sm`}
    >
      <Icon name={icon} size="sm" />
      <span>{label}</span>
    </button>
  );

  // Calculate statistics
  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    inactive: users.filter(u => !u.isActive).length,
    admins: users.filter(u => u.role === 'ADMIN').length,
    cashiers: users.filter(u => u.role === 'CASHIER').length
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="card-gradient">
        {/* Stats Row */}
        <div className="flex flex-col gap-4 mb-6 pt-8">
          
          {/* Status Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Total Users */}
            <div className="flex items-center bg-white rounded-2xl shadow-md px-4 sm:px-6 py-4 sm:py-5">
              <span className="flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-blue-200 mr-3 sm:mr-6">
                <Icon name="people" className="text-blue-600" size="lg" />
              </span>
              <div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm sm:text-base text-gray-500 mt-1">Total Users</div>
              </div>
            </div>
            {/* Active */}
            <div className="flex items-center bg-white rounded-2xl shadow-md px-4 sm:px-6 py-4 sm:py-5">
              <span className="flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-green-200 mr-3 sm:mr-6">
                <Icon name="check" className="text-green-600" size="lg" />
              </span>
              <div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">{stats.active}</div>
                <div className="text-sm sm:text-base text-gray-500 mt-1">Active</div>
              </div>
            </div>
            {/* Inactive */}
            <div className="flex items-center bg-white rounded-2xl shadow-md px-4 sm:px-6 py-4 sm:py-5">
              <span className="flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-red-200 mr-3 sm:mr-6">
                <Icon name="error" className="text-red-600" size="lg" />
              </span>
              <div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">{stats.inactive}</div>
                <div className="text-sm sm:text-base text-gray-500 mt-1">Inactive</div>
              </div>
            </div>
            {/* Admins */}
            <div className="flex items-center bg-white rounded-2xl shadow-md px-4 sm:px-6 py-4 sm:py-5">
              <span className="flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-purple-200 mr-3 sm:mr-6">
                <Icon name="admin" className="text-purple-600" size="lg" />
              </span>
              <div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">{stats.admins}</div>
                <div className="text-sm sm:text-base text-gray-500 mt-1">Admins</div>
              </div>
            </div>
            {/* Cashiers */}
            <div className="flex items-center bg-white rounded-2xl shadow-md px-4 sm:px-6 py-4 sm:py-5">
              <span className="flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-orange-200 mr-3 sm:mr-6">
                <Icon name="cashier" className="text-orange-600" size="lg" />
              </span>
          <div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">{stats.cashiers}</div>
                <div className="text-sm sm:text-base text-gray-500 mt-1">Cashiers</div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row justify-end items-center gap-3 sm:gap-6 w-full pb-8">
          {selectedUsers.length > 0 && (
            <ActionButton
              icon="delete"
              label={`Delete Selected (${selectedUsers.length})`}
              onClick={handleBulkDeleteUsers}
              color="danger"
            />
          )}
          <button
            className="btn-secondary flex items-center"
            onClick={() => setShowFilters(v => !v)}
          >
            <Icon name="filter" className="mr-2" /> Filters
          </button>
          {hasPermission('users.create') && (
          <button
            onClick={() => {
              setEditingUser(null);
              resetForm();
              setShowModal(true);
            }}
              className="btn-primary flex items-center space-x-2"
          >
              <Icon name="add" size="sm" />
              <span>Add User</span>
          </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card-gradient p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">Search</label>
            <div className="relative">
                <Icon name="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size="sm" />
              <input
                type="text"
                placeholder="Search users..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">Role</label>
              <select
                value={filters.role}
                onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              >
                <option value="">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="CASHIER">Cashier</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => {
                setFilters({ role: '', status: '', search: '' });
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="btn-secondary"
            >
              Reset
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="btn-primary"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

            {/* Users List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
              <div>
              <h3 className="text-xl font-bold text-gradient flex items-center">
                Users ({pagination.total})
              </h3>
              <p className="text-sm text-neutral-600 mt-1">
                Manage restaurant users and their roles
              </p>
            </div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedUsers.length === users.length && users.length > 0}
                onChange={handleSelectAll}
                onClick={(e) => e.stopPropagation()}
                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500 focus:ring-2"
                aria-label="Select all users"
              />
              <span className="text-sm font-medium text-neutral-700">Select All</span>
            </label>
          </div>
      </div>

        {loading ? (
          <UsersSkeleton rows={5} />
        ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                    <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSelectUser(user.id);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500 focus:ring-2 mr-3"
                        />
                      <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.username}</div>
                        {user.email && (
                          <div className="text-sm text-gray-500">{user.email}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.isActive)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                  </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {hasPermission('users.update') && (
                      <button
                        onClick={() => handleEdit(user)}
                            className="text-primary-600 hover:text-primary-900"
                      >
                            Edit
                      </button>
                        )}
                        {hasPermission('users.update') && (
                      <button
                            onClick={() => handleToggleActive(user)}
                            className={`${
                              user.isActive 
                                ? 'text-yellow-600 hover:text-yellow-900' 
                                : 'text-green-600 hover:text-green-900'
                            }`}
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                        )}
                        {hasPermission('users.delete') && (
                      <button
                            onClick={() => handleDeleteUser(user)}
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
        </div>
        )}

        {users.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filters.search || filters.role || filters.status
                ? 'Try adjusting your filters to find what you\'re looking for.'
                : 'Get started by creating your first user.'}
            </p>
            {!filters.search && !filters.role && !filters.status && hasPermission('users.create') && (
              <div className="mt-6">
                <button
                  onClick={() => {
                    setEditingUser(null);
                    resetForm();
                    setShowModal(true);
                  }}
                  className="btn-primary"
                >
                  Add User
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-neutral-200">
              <h2 className="text-xl font-bold text-neutral-900">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  disabled={!!editingUser}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  {editingUser ? 'New Password (leave blank to keep current)' : 'Password *'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Role *
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                >
                  <option value="CASHIER">Cashier</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingUser(null);
                    resetForm();
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-primary"
                >
                  {actionLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{editingUser ? 'Updating...' : 'Creating...'}</span>
                    </div>
                  ) : (
                    editingUser ? 'Update User' : 'Create User'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        icon={confirmDialog.icon}
        type={confirmDialog.type}
        onConfirm={() => {
          if (confirmDialog.title === 'Delete User') {
            handleDelete(confirmDialog.userId);
          } else if (confirmDialog.title === 'Delete Multiple Users') {
            handleBulkDelete();
          } else if (confirmDialog.title.includes('Activate') || confirmDialog.title.includes('Deactivate')) {
            toggleActive(confirmDialog.userId, !confirmDialog.isActive);
          }
          setConfirmDialog({ open: false });
        }}
        onCancel={() => setConfirmDialog({ open: false })}
      />
    </div>
  );
};

export default Users; 