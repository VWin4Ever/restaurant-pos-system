import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userPermissions, setUserPermissions] = useState([]);

  // Set up axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          // Set authorization header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await axios.get('/api/auth/profile');
          const userData = response.data.data;
          setUser(userData);
          
          // Fetch user permissions if user is a cashier
          if (userData.role === 'CASHIER') {
            try {
              const permissionsResponse = await axios.get(`/api/users/${userData.id}`);
              setUserPermissions(permissionsResponse.data.data.permissions || []);
            } catch (error) {
              console.error('Error fetching user permissions:', error);
              setUserPermissions([]);
            }
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (username, password) => {
    try {
      const response = await axios.post('/api/auth/login', {
        username,
        password
      });

      const { user: userData, token: authToken } = response.data.data;
      
      setUser(userData);
      setToken(authToken);
      localStorage.setItem('token', authToken);
      
      // Set authorization header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      
      // Fetch user permissions if user is a cashier
      if (userData.role === 'CASHIER') {
        try {
          const permissionsResponse = await axios.get(`/api/users/${userData.id}`);
          setUserPermissions(permissionsResponse.data.data.permissions || []);
        } catch (error) {
          console.error('Error fetching user permissions:', error);
          setUserPermissions([]);
        }
      }
      
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setUserPermissions([]);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    toast.info('Logged out successfully');
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await axios.post('/api/auth/change-password', {
        currentPassword,
        newPassword
      });
      
      toast.success('Password changed successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to change password';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Role-based permissions
  const ROLE_PERMISSIONS = {
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
      'products.view',
      'categories.view',
      'tables.read',
      'tables.update',
      'stock.read',
      'stock.update',
      'reports.view'
    ]
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    
    // Admin has all permissions
    if (user.role === 'ADMIN') return true;
    
    // Check role-based permissions
    const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
    
    // Check exact permission
    if (rolePermissions.includes(permission)) {
      return true;
    }
    
    // Check wildcard permissions
    const [module, action] = permission.split('.');
    const wildcardPermission = `${module}.*`;
    
    if (rolePermissions.includes(wildcardPermission)) {
      return true;
    }

    // Check custom user permissions
    if (userPermissions.includes(permission)) {
      return true;
    }

    if (userPermissions.includes(wildcardPermission)) {
      return true;
    }
    
    return false;
  };

  const canPerformAction = (action, resource) => {
    const permission = `${resource}.${action}`;
    return hasPermission(permission);
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    changePassword,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isCashier: user?.role === 'CASHIER',
    hasPermission,
    canPerformAction,
    userPermissions
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 