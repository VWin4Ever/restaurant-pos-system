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
          setUser(response.data.data);
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
    hasPermission: (permission) => {
      // Simple role-based permissions
      if (!user) return false;
      
      // Admin has all permissions
      if (user.role === 'ADMIN') return true;
      
      // Cashier permissions
      if (user.role === 'CASHIER') {
        const cashierPermissions = [
          'orders.create',
          'orders.read',
          'orders.update',
          'products.view',
          'categories.view',
          'tables.read',
          'tables.update',
          'stock.read',
          'stock.update'
        ];
        return cashierPermissions.includes(permission);
      }
      
      return false;
    },
    canPerformAction: (action, resource) => {
      const permission = `${resource}.${action}`;
      // Simple role-based permissions
      if (!user) return false;
      
      // Admin has all permissions
      if (user.role === 'ADMIN') return true;
      
      // Cashier permissions
      if (user.role === 'CASHIER') {
        const cashierPermissions = [
          'orders.create',
          'orders.read',
          'orders.update',
          'products.view',
          'categories.view',
          'tables.read',
          'tables.update',
          'stock.read',
          'stock.update'
        ];
        return cashierPermissions.includes(permission);
      }
      
      return false;
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 