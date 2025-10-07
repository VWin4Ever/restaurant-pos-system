import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import LoadingSpinner from '../common/LoadingSpinner';
import ConfirmDialog from '../common/ConfirmDialog';
import Icon from '../common/Icon';
import { useAuth } from '../../contexts/AuthContext';
import { useCache } from '../../hooks/useCache';

// Constants for better maintainability
const DEFAULT_PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_DELAY = 300;
const MAX_RETRY_ATTEMPTS = 2;
const RETRY_DELAY = 1000;

// Permission templates for quick setup
const PERMISSION_TEMPLATES = {
  ADMIN: [
    'orders.*',
    'products.*',
    'categories.*',
    'tables.*',
    'stock.*',
    'reports.*',
    'settings.*',
    'users.*'
  ],
  CASHIER: [
    'orders.create',
    'orders.read',
    'orders.update',
    'products.read',
    'categories.read',
    'tables.read',
    'tables.update',
    'stock.read',
    'stock.update',
    'reports.read'
  ]
};

// Debounce utility function
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Skeleton loader for users table
const UsersSkeleton = ({ rows = 5 }) => (
  <div className="space-y-4 p-6">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="animate-pulse bg-surface rounded-xl h-20 w-full" />
    ))}
  </div>
);

const Users = () => {
  const { hasPermission, user: currentUser } = useAuth();
  const { fetchWithCache, clearCache } = useCache();
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ open: false });
  const [isMobile, setIsMobile] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [availablePermissions, setAvailablePermissions] = useState([]);
  
  // Filter states
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    search: ''
  });
  
  // Quick filter state
  const [quickFilter, setQuickFilter] = useState('');
  
  // Debounced search for better performance
  const debouncedSearch = useDebounce(filters.search, SEARCH_DEBOUNCE_DELAY);
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    total: 0,
    pages: 0
  });

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    role: 'CASHIER',
    permissions: [],
  });

  // Permissions form state
  const [permissionsForm, setPermissionsForm] = useState({
    permissions: []
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
    fetchAvailablePermissions();
  }, [pagination.page]);

  // Synchronize filter dropdowns with quickFilter
  useEffect(() => {
    if (filters.status === 'active' || filters.status === 'inactive') {
      setQuickFilter(filters.status);
    } else if (filters.role === 'ADMIN' || filters.role === 'CASHIER') {
      setQuickFilter(filters.role);
    } else if (filters.status === '' && filters.role === '') {
      // Only clear quickFilter if both status and role are empty
      setQuickFilter('');
    }
  }, [filters.status, filters.role]);

  // Memoized filtering function for better performance
  const applyFilters = useCallback((users, searchTerm, role, status, quickFilter) => {
    return users.filter(user => {
      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!user.name.toLowerCase().includes(searchLower) && 
            !user.email.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      // Apply role filter (from dropdown or quick filter)
      const selectedRole = role || (quickFilter === 'ADMIN' ? 'ADMIN' : quickFilter === 'CASHIER' ? 'CASHIER' : null);
      if (selectedRole && user.role !== selectedRole) {
        return false;
      }
      
      // Apply status filter (from dropdown or quick filter)
      const selectedStatus = status || (quickFilter === 'active' ? 'active' : quickFilter === 'inactive' ? 'inactive' : null);
      if (selectedStatus === 'active' && !user.isActive) return false;
      if (selectedStatus === 'inactive' && user.isActive) return false;
      
      return true;
    });
  }, []);

  // Memoized filtered users
  const filteredUsers = useMemo(() => {
    return applyFilters(allUsers, debouncedSearch, filters.role, filters.status, quickFilter);
  }, [allUsers, debouncedSearch, filters.role, filters.status, quickFilter, applyFilters]);

  // Update users when filtered results change
  useEffect(() => {
    setUsers(filteredUsers);
  }, [filteredUsers]);

  const fetchUsers = useCallback(async (retryCount = 0) => {
    const cacheKey = `users_${pagination.page}_${pagination.limit}`;
    
    try {
      setLoading(true);
      
      const data = await fetchWithCache(cacheKey, async () => {
        const params = new URLSearchParams({
          page: pagination.page,
          limit: pagination.limit
        });

        const response = await axios.get(`/api/users?${params}`);
        return response.data;
      }, 2 * 60 * 1000); // 2 minutes cache
      
      setAllUsers(data.data);
      setUsers(data.data);
      
      // Handle both new pagination format and old format for backward compatibility
      if (data.pagination) {
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          pages: data.pagination.pages
        }));
      } else {
        // Fallback for old API format
        setPagination(prev => ({
          ...prev,
          total: data.data.length,
          pages: 1
        }));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      
      // Retry logic for network errors
      if (retryCount < MAX_RETRY_ATTEMPTS && (error.code === 'NETWORK_ERROR' || error.response?.status >= 500)) {
        setTimeout(() => fetchUsers(retryCount + 1), RETRY_DELAY * (retryCount + 1));
        return;
      }
      
      // More specific error messages
      const errorMessage = error.response?.status === 403 
        ? 'You do not have permission to view users'
        : error.response?.status === 404
        ? 'Users endpoint not found'
        : error.response?.status >= 500
        ? 'Server error. Please try again later.'
        : 'Failed to fetch users. Please check your connection.';
        
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, fetchWithCache]);


  const fetchAvailablePermissions = async () => {
    try {
      const response = await axios.get('/api/users/permissions/available');
      setAvailablePermissions(response.data.data);
    } catch (error) {
      console.error('Error fetching available permissions:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Enhanced client-side validation
    if (!formData.username.trim()) {
      toast.error('Username is required');
      return;
    }
    
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    
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
    
    // Validate permissions
    const permissionWarnings = validatePermissions(formData.permissions);
    if (permissionWarnings.length > 0) {
      toast.warning(`Permission conflicts detected: ${permissionWarnings.join(', ')}`);
      // Continue anyway, but show warning
    }
    
    setActionLoading(true);
    
    try {
      let userId;
      if (editingUser) {
        await axios.put(`/api/users/${editingUser.id}`, formData);
        userId = editingUser.id;
        toast.success('User updated successfully');
      } else {
        const response = await axios.post('/api/users', formData);
        userId = response.data.data.id;
        toast.success('User created successfully');
      }
      
      setShowModal(false);
      setEditingUser(null);
      resetForm();
      setSelectedUsers([]); // Clear selected users after operation
      
      // Clear cache and refetch
      clearCache();
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      
      // More specific error messages
      const errorMessage = error.response?.status === 409
        ? 'Username or email already exists'
        : error.response?.status === 403
        ? 'You do not have permission to perform this action'
        : error.response?.status === 400
        ? error.response?.data?.message || 'Invalid user data provided'
        : error.response?.data?.message || 'Failed to save user. Please try again.';
        
      toast.error(errorMessage);
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
      role: user.role,
      permissions: user.permissions || [],
    });
    setShowModal(true);
  };

  const handleEditPermissions = (user) => {
    setEditingUser(user);
    setPermissionsForm({
      permissions: user.permissions || []
    });
    setShowPermissionsModal(true);
  };

  const handlePermissionsSubmit = async (e) => {
    e.preventDefault();
    
    // Validate permissions
    const permissionWarnings = validatePermissions(permissionsForm.permissions);
    if (permissionWarnings.length > 0) {
      toast.warning(`Permission conflicts detected: ${permissionWarnings.join(', ')}`);
      // Continue anyway, but show warning
    }
    
    setActionLoading(true);
    
    try {
      await axios.patch(`/api/users/${editingUser.id}/permissions`, permissionsForm);
      toast.success('User permissions updated successfully');
      setShowPermissionsModal(false);
      setEditingUser(null);
      setPermissionsForm({ permissions: [] });
      fetchUsers();
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast.error(error.response?.data?.message || 'Failed to update permissions');
    } finally {
      setActionLoading(false);
    }
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
    // Check if trying to delete current user
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

  const handleExportCsv = async () => {
    try {
      const response = await axios.get('/api/users/export', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Users exported successfully');
    } catch (error) {
      console.error('Error exporting users:', error);
      toast.error('Failed to export users');
    }
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
    // Check if trying to deactivate current user
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
      role: 'CASHIER',
      permissions: []
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

  // Memoized grouped permissions (moved up to avoid hoisting issues)
  const groupedPermissions = useMemo(() => {
    return availablePermissions.reduce((acc, permission) => {
      const [module] = permission.split('.');
      if (!acc[module]) {
        acc[module] = [];
      }
      acc[module].push(permission);
      return acc;
    }, {});
  }, [availablePermissions]);

  // Consolidated permission change handler
  const handlePermissionChange = useCallback((permission, checked, isPermissionsModal = false) => {
    if (isPermissionsModal) {
      setPermissionsForm(prev => ({
        ...prev,
        permissions: checked 
          ? [...prev.permissions, permission]
          : prev.permissions.filter(p => p !== permission)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        permissions: checked 
          ? [...prev.permissions, permission]
          : prev.permissions.filter(p => p !== permission)
      }));
    }
  }, []);

  // Bulk permission operations
  const handleBulkPermissionChange = useCallback((module, checked, isPermissionsModal = false) => {
    const modulePermissions = groupedPermissions[module] || [];
    
    if (isPermissionsModal) {
      setPermissionsForm(prev => ({
        ...prev,
        permissions: checked 
          ? [...new Set([...prev.permissions, ...modulePermissions])]
          : prev.permissions.filter(p => !modulePermissions.includes(p))
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        permissions: checked 
          ? [...new Set([...prev.permissions, ...modulePermissions])]
          : prev.permissions.filter(p => !modulePermissions.includes(p))
      }));
    }
  }, [groupedPermissions]);

  // Apply permission template based on role
  const applyPermissionTemplate = useCallback((role, isPermissionsModal = false) => {
    const templatePermissions = PERMISSION_TEMPLATES[role] || [];
    
    if (isPermissionsModal) {
      setPermissionsForm(prev => ({
        ...prev,
        permissions: templatePermissions
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        permissions: templatePermissions
      }));
    }
  }, []);

  // Validate permissions (prevent invalid combinations)
  const validatePermissions = useCallback((permissions) => {
    const warnings = [];
    
    // Check for conflicting permissions (e.g., having both specific and wildcard)
    const modules = [...new Set(permissions.map(p => p.split('.')[0]))];
    
    modules.forEach(module => {
      const modulePermissions = permissions.filter(p => p.startsWith(module + '.'));
      const hasWildcard = modulePermissions.includes(`${module}.*`);
      const hasSpecific = modulePermissions.some(p => p !== `${module}.*`);
      
      if (hasWildcard && hasSpecific) {
        warnings.push(`${module}.* already includes all ${module} permissions`);
      }
    });
    
    return warnings;
  }, []);

  // Get permission display name
  const getPermissionDisplayName = useCallback((permission) => {
    const [module, action] = permission.split('.');
    const actionMap = {
      'create': 'Create',
      'read': 'View',
      'update': 'Edit',
      'delete': 'Delete',
      '*': 'All Actions'
    };
    
    return `${module.charAt(0).toUpperCase() + module.slice(1)} - ${actionMap[action] || action}`;
  }, []);

  const getRoleBadge = useCallback((role) => {
    const colors = {
      ADMIN: 'bg-blue-100 text-blue-800 border-blue-200',
      CASHIER: 'bg-green-100 text-green-800 border-green-200'
    };
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${colors[role] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {role}
      </span>
    );
  }, []);

  const getStatusBadge = useCallback((isActive) => {
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
  }, []);

  const formatDate = useCallback((date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  const ActionButton = ({ icon, label, onClick, color = 'primary' }) => (
    <button
      onClick={onClick}
      className={`btn-${color} flex items-center space-x-2 px-3 py-2 text-sm`}
    >
      <Icon name={icon} size="sm" />
      <span>{label}</span>
    </button>
  );


  // Memoized statistics based on filtered users
  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.isActive).length,
    inactive: users.filter(u => !u.isActive).length,
    admins: users.filter(u => u.role === 'ADMIN').length,
    cashiers: users.filter(u => u.role === 'CASHIER').length
  }), [users]);

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
            {/* Total Users - Not clickable */}
            <div className="p-6 rounded-xl shadow-lg text-white" style={{ background: 'linear-gradient(to right, #53B312, #4A9E0F)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Users</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <div className="text-4xl">
                  <Icon name="users" size="2xl" color="white" />
                </div>
              </div>
            </div>
            
            {/* Active - Clickable filter */}
            <button 
              onClick={() => {
                const newFilter = quickFilter === 'active' ? '' : 'active';
                setQuickFilter(newFilter);
                setFilters(prev => ({ ...prev, status: newFilter }));
              }}
              className={`bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white hover:from-green-600 hover:to-green-700 hover:shadow-xl transition-all duration-200 hover:scale-105 focus:ring-4 focus:ring-green-300 focus:outline-none ${
                quickFilter === 'active' ? 'ring-4 ring-green-300 scale-105' : ''
              }`}
              title={quickFilter === 'active' ? 'Click to show all users' : 'Click to filter and show only active users'}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Active</p>
                  <p className="text-3xl font-bold">{stats.active}</p>
                </div>
                <div className="text-4xl">
                  <Icon name="check-circle" size="2xl" color="white" />
                </div>
              </div>
            </button>
            
            {/* Inactive - Clickable filter */}
            <button 
              onClick={() => {
                const newFilter = quickFilter === 'inactive' ? '' : 'inactive';
                setQuickFilter(newFilter);
                setFilters(prev => ({ ...prev, status: newFilter }));
              }}
              className={`bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-xl shadow-lg text-white hover:from-red-600 hover:to-red-700 hover:shadow-xl transition-all duration-200 hover:scale-105 focus:ring-4 focus:ring-red-300 focus:outline-none ${
                quickFilter === 'inactive' ? 'ring-4 ring-red-300 scale-105' : ''
              }`}
              title={quickFilter === 'inactive' ? 'Click to show all users' : 'Click to filter and show only inactive users'}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Inactive</p>
                  <p className="text-3xl font-bold">{stats.inactive}</p>
                </div>
                <div className="text-4xl">
                  <Icon name="x-circle" size="2xl" color="white" />
                </div>
              </div>
            </button>
            
            {/* Admins - Clickable filter */}
            <button 
              onClick={() => {
                const newFilter = quickFilter === 'ADMIN' ? '' : 'ADMIN';
                setQuickFilter(newFilter);
                setFilters(prev => ({ ...prev, role: newFilter }));
              }}
              className={`bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white hover:from-purple-600 hover:to-purple-700 hover:shadow-xl transition-all duration-200 hover:scale-105 focus:ring-4 focus:ring-purple-300 focus:outline-none ${
                quickFilter === 'ADMIN' ? 'ring-4 ring-purple-300 scale-105' : ''
              }`}
              title={quickFilter === 'ADMIN' ? 'Click to show all users' : 'Click to filter and show only admin users'}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Admins</p>
                  <p className="text-3xl font-bold">{stats.admins}</p>
                </div>
                <div className="text-4xl">
                  <Icon name="shield" size="2xl" color="white" />
                </div>
              </div>
            </button>
            
            {/* Cashiers - Clickable filter */}
            <button 
              onClick={() => {
                const newFilter = quickFilter === 'CASHIER' ? '' : 'CASHIER';
                setQuickFilter(newFilter);
                setFilters(prev => ({ ...prev, role: newFilter }));
              }}
              className={`bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg text-white hover:from-orange-600 hover:to-orange-700 hover:shadow-xl transition-all duration-200 hover:scale-105 focus:ring-4 focus:ring-orange-300 focus:outline-none ${
                quickFilter === 'CASHIER' ? 'ring-4 ring-orange-300 scale-105' : ''
              }`}
              title={quickFilter === 'CASHIER' ? 'Click to show all users' : 'Click to filter and show only cashier users'}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Cashiers</p>
                  <p className="text-3xl font-bold">{stats.cashiers}</p>
                </div>
                <div className="text-4xl">
                  <Icon name="user" size="2xl" color="white" />
                </div>
              </div>
            </button>
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
          <div className="flex items-center space-x-3">
            {hasPermission('users.view') && (
              <button
                onClick={handleExportCsv}
                className="btn-secondary flex items-center space-x-2"
              >
                <Icon name="download" size="sm" />
                <span>Export</span>
              </button>
            )}
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
                setQuickFilter('');
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
                Users ({quickFilter ? users.length : pagination.total})
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
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Login Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shift
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
                        {user.permissions && user.permissions.length > 0 && (
                          <div className="text-xs text-gray-400 mt-1">
                            {user.permissions.length} custom permission{user.permissions.length !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getRoleBadge(user.role)}
                      {user.permissions && user.permissions.length > 0 && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                          +{user.permissions.length} custom
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.isActive)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {user.loginCount || 0}
                      </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.creator ? (
                        <div>
                          <div className="font-medium">{user.creator.name}</div>
                          <div className="text-xs text-gray-400">@{user.creator.username}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">System</span>
                      )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.shift ? (
                      <div className="flex items-center space-x-2">
                        <Icon name="clock" size="sm" className="text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">{user.shift.name}</div>
                          <div className="text-xs text-gray-500">
                            {user.shift.startTime} - {user.shift.endTime}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">No shift assigned</span>
                    )}
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
                        {hasPermission('users.update') && user.role === 'CASHIER' && (
                      <button
                        onClick={() => handleEditPermissions(user)}
                            className="text-purple-600 hover:text-purple-900"
                      >
                            Permissions
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
              {filters.search || filters.role || filters.status || quickFilter
                ? 'Try adjusting your filters to find what you\'re looking for.'
                : 'Get started by creating your first user.'}
            </p>
            {!filters.search && !filters.role && !filters.status && !quickFilter && hasPermission('users.create') && (
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
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-neutral-200">
              <h2 className="text-xl font-bold text-neutral-900">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>


              {/* Permissions Section - Only show for Cashiers */}
              {formData.role === 'CASHIER' && (
                <div className="border-t border-neutral-200 pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-neutral-900">Custom Permissions</h3>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => applyPermissionTemplate('CASHIER')}
                        className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                      >
                        Cashier Template
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, permissions: [] }))}
                        className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-60 overflow-y-auto">
                    {Object.entries(groupedPermissions).map(([module, permissions]) => {
                      const modulePermissions = permissions.filter(p => formData.permissions.includes(p));
                      const isModuleFullySelected = modulePermissions.length === permissions.length;
                      const isModulePartiallySelected = modulePermissions.length > 0 && modulePermissions.length < permissions.length;
                      
                      return (
                        <div key={module} className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={isModuleFullySelected}
                              ref={input => {
                                if (input) input.indeterminate = isModulePartiallySelected;
                              }}
                              onChange={(e) => handleBulkPermissionChange(module, e.target.checked)}
                              className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500 focus:ring-2"
                            />
                            <h4 className="font-medium text-neutral-700 capitalize">
                              {module} ({modulePermissions.length}/{permissions.length})
                            </h4>
                          </div>
                          <div className="ml-6 space-y-1">
                            {permissions.map(permission => (
                              <label key={permission} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={formData.permissions.includes(permission)}
                                  onChange={(e) => handlePermissionChange(permission, e.target.checked)}
                                  className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500 focus:ring-2"
                                />
                                <span className="text-sm text-neutral-600">
                                  {getPermissionDisplayName(permission)}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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

      {/* Permissions Modal */}
      {showPermissionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-neutral-200">
              <h2 className="text-xl font-bold text-neutral-900">
                Manage Permissions - {editingUser?.name}
              </h2>
            </div>
            
            <form onSubmit={handlePermissionsSubmit} className="p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-neutral-600">Role:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    editingUser?.role === 'ADMIN' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {editingUser?.role}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => applyPermissionTemplate(editingUser?.role, true)}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                  >
                    Apply {editingUser?.role} Template
                  </button>
                  <button
                    type="button"
                    onClick={() => setPermissionsForm({ permissions: [] })}
                    className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(groupedPermissions).map(([module, permissions]) => {
                  const modulePermissions = permissions.filter(p => permissionsForm.permissions.includes(p));
                  const isModuleFullySelected = modulePermissions.length === permissions.length;
                  const isModulePartiallySelected = modulePermissions.length > 0 && modulePermissions.length < permissions.length;
                  
                  return (
                    <div key={module} className="space-y-3">
                      <div className="flex items-center space-x-2 border-b border-neutral-200 pb-2">
                        <input
                          type="checkbox"
                          checked={isModuleFullySelected}
                          ref={input => {
                            if (input) input.indeterminate = isModulePartiallySelected;
                          }}
                          onChange={(e) => handleBulkPermissionChange(module, e.target.checked, true)}
                          className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500 focus:ring-2"
                        />
                        <h3 className="font-semibold text-neutral-900 capitalize">
                          {module} ({modulePermissions.length}/{permissions.length})
                        </h3>
                      </div>
                      <div className="ml-6 space-y-2">
                        {permissions.map(permission => (
                          <label key={permission} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={permissionsForm.permissions.includes(permission)}
                              onChange={(e) => handlePermissionChange(permission, e.target.checked, true)}
                              className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500 focus:ring-2"
                            />
                            <span className="text-sm text-neutral-600">
                              {getPermissionDisplayName(permission)}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowPermissionsModal(false);
                    setEditingUser(null);
                    setPermissionsForm({ permissions: [] });
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
                      <span>Updating...</span>
                    </div>
                  ) : (
                    'Update Permissions'
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