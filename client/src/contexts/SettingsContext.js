import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    business: {
      restaurantName: 'Restaurant POS',
      address: '123 Main Street, City, State 12345',
      phone: '+1 (555) 123-4567',
      email: 'info@restaurant.com',
      taxRate: 10.0, // Updated to 10% as requested
      currency: 'USD',
      timezone: 'Asia/Phnom_Penh' // Updated to Cambodia timezone
    },
    system: {
      autoRefreshInterval: 30,
      lowStockThreshold: 10,
      maxTables: 20,
      enableNotifications: true,
      enableAutoBackup: false,
      backupFrequency: 'daily'
    },
    security: {
      sessionTimeout: 1440,
      forceLogoutOnPasswordChange: true,
      minPasswordLength: 6,
      requireUppercase: true,
      requireNumbers: true
    }
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/api/settings');
      const fetchedSettings = response.data.data;
      console.log('Settings fetched:', fetchedSettings);
      console.log('Tax Rate from settings:', fetchedSettings.business?.taxRate);
      setSettings(fetchedSettings);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      // Don't show error toast for initial load
      // Keep using default settings from state
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (category, data) => {
    try {
      await axios.put(`/api/settings/${category}`, data);
      await fetchSettings(); // Refresh settings
      toast.success(`${category.charAt(0).toUpperCase() + category.slice(1)} settings updated successfully!`);
      return true;
    } catch (error) {
      console.error(`Failed to update ${category} settings:`, error);
      toast.error(`Failed to update ${category} settings`);
      return false;
    }
  };

  const resetSettings = async () => {
    try {
      await axios.post('/api/settings/reset');
      await fetchSettings(); // Refresh settings
      toast.success('Settings reset to defaults successfully!');
      return true;
    } catch (error) {
      console.error('Failed to reset settings:', error);
      toast.error('Failed to reset settings');
      return false;
    }
  };

  // Helper functions for common operations
  const getTaxRate = () => {
    const taxRate = settings.business?.taxRate;
    // Return taxRate if it's a number, otherwise default to 8.5
    return typeof taxRate === 'number' ? taxRate : 8.5;
  };
  const getCurrency = () => settings.business?.currency || 'USD';
  const getRestaurantName = () => settings.business?.restaurantName || 'Restaurant POS';
  const getTimezone = () => settings.business?.timezone || 'UTC';

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '$0.00';
    const currency = getCurrency();
    
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      // Fallback for unsupported currencies
      console.warn(`Currency ${currency} not supported, falling back to USD`);
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    }
  };

  const calculateTax = (subtotal) => {
    const taxRate = getTaxRate();
    return (subtotal * taxRate) / 100;
  };

  useEffect(() => {
    // Only fetch settings if user is authenticated
    const token = localStorage.getItem('token');
    if (token) {
      fetchSettings();
    } else {
      setLoading(false);
    }
  }, []);

  const value = {
    settings,
    loading,
    fetchSettings,
    updateSettings,
    resetSettings,
    getTaxRate,
    getCurrency,
    getRestaurantName,
    getTimezone,
    formatCurrency,
    calculateTax
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}; 