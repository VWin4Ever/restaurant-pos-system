import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from 'axios';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';
import ConfirmDialog from '../common/ConfirmDialog';
import Icon from '../common/Icon';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';

const businessSchema = yup.object({
  restaurantName: yup.string()
    .trim()
    .min(2, 'Restaurant name must be at least 2 characters')
    .max(100, 'Restaurant name must be less than 100 characters')
    .required('Restaurant name is required'),
  address: yup.string()
    .trim()
    .min(10, 'Address must be at least 10 characters')
    .max(200, 'Address must be less than 200 characters')
    .required('Address is required'),
  phone: yup.string()
    .trim()
    .required('Phone number is required')
    .matches(/^[\+]?[\d\s\-\(\)]{7,20}$/, 'Please enter a valid phone number'),
  email: yup.string()
    .trim()
    .email('Invalid email format')
    .required('Email is required'),
  taxRate: yup.number()
    .min(0, 'Tax rate cannot be negative')
    .max(100, 'Tax rate cannot exceed 100%')
    .required('Tax rate is required'),
  currency: yup.string()
    .required('Currency is required'),
  timezone: yup.string()
    .required('Timezone is required')
}).required();

const systemSchema = yup.object({
  autoRefreshInterval: yup.number().min(10).max(300).required('Auto refresh interval is required'),
  lowStockThreshold: yup.number().min(1).max(100).required('Low stock threshold is required'),
  maxTables: yup.number().min(1).max(100).required('Maximum tables is required'),
  enableNotifications: yup.boolean(),
  enableAutoBackup: yup.boolean(),
  backupFrequency: yup.string().when('enableAutoBackup', {
    is: true,
    then: yup.string().required('Backup frequency is required when auto backup is enabled'),
    otherwise: yup.string().optional()
  })
}).required();

const securitySchema = yup.object({
  sessionTimeout: yup.number().min(15).max(480).required('Session timeout is required'),
  forceLogoutOnPasswordChange: yup.boolean(),
  minPasswordLength: yup.number().min(6).max(20).required('Minimum password length is required'),
  requireUppercase: yup.boolean(),
  requireNumbers: yup.boolean()
}).required();

const Settings = () => {
  const { hasPermission } = useAuth();
  const { settings: globalSettings, loading: settingsLoading, fetchSettings: fetchGlobalSettings } = useSettings();
  const [activeTab, setActiveTab] = useState('business');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const businessForm = useForm({
    resolver: yupResolver(businessSchema),
    defaultValues: {
      restaurantName: '',
      address: '',
      phone: '',
      email: '',
      taxRate: 0,
      currency: 'USD',
      timezone: 'UTC'
    }
  });

  const systemForm = useForm({
    resolver: yupResolver(systemSchema),
    defaultValues: {
      autoRefreshInterval: 30,
      lowStockThreshold: 10,
      maxTables: 20,
      enableNotifications: true,
      enableAutoBackup: false,
      backupFrequency: 'daily'
    }
  });

  const securityForm = useForm({
    resolver: yupResolver(securitySchema),
    defaultValues: {
      sessionTimeout: 1440,
      forceLogoutOnPasswordChange: true,
      minPasswordLength: 6,
      requireUppercase: true,
      requireNumbers: true
    }
  });

  useEffect(() => {
    if (!settingsLoading && globalSettings) {
      // Set form values from global settings
      businessForm.reset({
        restaurantName: globalSettings.business?.restaurantName || '',
        address: globalSettings.business?.address || '',
        phone: globalSettings.business?.phone || '',
        email: globalSettings.business?.email || '',
        taxRate: globalSettings.business?.taxRate || 0,
        currency: globalSettings.business?.currency || 'USD',
        timezone: globalSettings.business?.timezone || 'UTC'
      });

      systemForm.reset({
        autoRefreshInterval: globalSettings.system?.autoRefreshInterval || 30,
        lowStockThreshold: globalSettings.system?.lowStockThreshold || 10,
        maxTables: globalSettings.system?.maxTables || 20,
        enableNotifications: globalSettings.system?.enableNotifications !== false,
        enableAutoBackup: globalSettings.system?.enableAutoBackup || false,
        backupFrequency: globalSettings.system?.backupFrequency || 'daily'
      });

      securityForm.reset({
        sessionTimeout: globalSettings.security?.sessionTimeout || 1440,
        forceLogoutOnPasswordChange: globalSettings.security?.forceLogoutOnPasswordChange !== false,
        minPasswordLength: globalSettings.security?.minPasswordLength || 6,
        requireUppercase: globalSettings.security?.requireUppercase !== false,
        requireNumbers: globalSettings.security?.requireNumbers !== false
      });
      
      setLoading(false);
    }
  }, [settingsLoading, globalSettings, businessForm, systemForm, securityForm]);

  const saveBusinessSettings = async (data) => {
    setSaving(true);
    try {
      const response = await axios.put('/api/settings/business', data);
      
      if (response.data.success) {
        toast.success('Business settings saved successfully!');
        // Refresh global settings
        await fetchGlobalSettings();
      } else {
        throw new Error(response.data.message || 'Failed to save business settings');
      }
    } catch (error) {
      console.error('Failed to save business settings:', error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map(err => err.msg).join(', ');
        toast.error(`Validation errors: ${errorMessages}`);
      } else {
        toast.error('Failed to save business settings');
      }
    } finally {
      setSaving(false);
    }
  };

  const saveSystemSettings = async (data) => {
    setSaving(true);
    try {
      await axios.put('/api/settings/system', data);
      toast.success('System settings saved successfully!');
      // Refresh global settings
      await fetchGlobalSettings();
    } catch (error) {
      console.error('Failed to save system settings:', error);
      toast.error('Failed to save system settings');
    } finally {
      setSaving(false);
    }
  };

  const saveSecuritySettings = async (data) => {
    setSaving(true);
    try {
      await axios.put('/api/settings/security', data);
      toast.success('Security settings saved successfully!');
      // Refresh global settings
      await fetchGlobalSettings();
    } catch (error) {
      console.error('Failed to save security settings:', error);
      toast.error('Failed to save security settings');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    setResetLoading(true);
    try {
      await axios.post('/api/settings/reset');
      toast.success('Settings reset to defaults successfully!');
      
      // Refresh global settings
      await fetchGlobalSettings();
      
      setShowResetDialog(false);
    } catch (error) {
      console.error('Failed to reset settings:', error);
      toast.error('Failed to reset settings');
    } finally {
      setResetLoading(false);
    }
  };

  const createBackup = async () => {
    setBackupLoading(true);
    try {
      const response = await axios.post('/api/settings/backup');
      
      if (!response.data.data) {
        throw new Error('No backup data received');
      }
      
      toast.success('Backup created successfully!');
      setShowBackupDialog(false);
      
      // Download backup file
      const blob = new Blob([JSON.stringify(response.data.data, null, 2)], {
        type: 'application/json'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pos-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to create backup:', error);
      toast.error('Failed to create backup');
    } finally {
      setBackupLoading(false);
    }
  };

  const currencies = [
    { code: 'USD', name: 'US Dollar ($)' },
    { code: 'EUR', name: 'Euro (€)' },
    { code: 'GBP', name: 'British Pound (£)' },
    { code: 'JPY', name: 'Japanese Yen (¥)' },
    { code: 'CAD', name: 'Canadian Dollar (C$)' },
    { code: 'AUD', name: 'Australian Dollar (A$)' }
  ];

  const timezones = [
    { value: 'UTC', name: 'UTC (Coordinated Universal Time)' },
    { value: 'America/New_York', name: 'Eastern Time (ET)' },
    { value: 'America/Chicago', name: 'Central Time (CT)' },
    { value: 'America/Denver', name: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', name: 'Pacific Time (PT)' },
    { value: 'Europe/London', name: 'London (GMT)' },
    { value: 'Europe/Paris', name: 'Paris (CET)' },
    { value: 'Asia/Tokyo', name: 'Tokyo (JST)' }
  ];

  if (loading || settingsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">


      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex justify-between items-center px-6">
            <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('business')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'business'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Icon name="business" size="sm" />
                <span>Business Settings</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'system'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Icon name="settings" size="sm" />
                <span>System Settings</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'security'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Icon name="security" size="sm" />
                <span>Security Settings</span>
              </div>
            </button>
            </nav>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              {hasPermission('settings.backup') && (
                <button
                  onClick={() => setShowBackupDialog(true)}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Icon name="backup" size="sm" />
                  <span>Create Backup</span>
                </button>
              )}
              {hasPermission('settings.reset') && (
                <button
                  onClick={() => setShowResetDialog(true)}
                  className="btn-danger flex items-center space-x-2"
                >
                  <Icon name="reset" size="sm" />
                  <span>Reset to Defaults</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Business Settings Tab */}
          {activeTab === 'business' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gradient flex items-center">
                  <Icon name="business" className="mr-2" />
                  Business Information
                </h2>
                <p className="text-sm text-neutral-600 mt-1">
                  Configure your restaurant's basic information and business settings
                </p>
              </div>
              
              <form onSubmit={businessForm.handleSubmit(saveBusinessSettings)} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-neutral-800 border-b border-neutral-200 pb-2">
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">
                        Restaurant Name *
                      </label>
                      <input
                        {...businessForm.register('restaurantName')}
                        className={`w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent ${
                          businessForm.formState.errors.restaurantName ? 'border-red-300' : ''
                        }`}
                        placeholder="Enter restaurant name"
                      />
                      {businessForm.formState.errors.restaurantName && (
                        <p className="mt-1 text-sm text-red-600">{businessForm.formState.errors.restaurantName.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        {...businessForm.register('phone')}
                        className={`w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent ${
                          businessForm.formState.errors.phone ? 'border-red-300' : ''
                        }`}
                        placeholder="Enter phone number"
                      />
                      {businessForm.formState.errors.phone && (
                        <p className="mt-1 text-sm text-red-600">{businessForm.formState.errors.phone.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        {...businessForm.register('email')}
                        type="email"
                        className={`w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent ${
                          businessForm.formState.errors.email ? 'border-red-300' : ''
                        }`}
                        placeholder="Enter email address"
                      />
                      {businessForm.formState.errors.email && (
                        <p className="mt-1 text-sm text-red-600">{businessForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">
                        Address *
                      </label>
                      <textarea
                        {...businessForm.register('address')}
                        rows={3}
                        className={`w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent ${
                          businessForm.formState.errors.address ? 'border-red-300' : ''
                        }`}
                        placeholder="Enter business address"
                      />
                      {businessForm.formState.errors.address && (
                        <p className="mt-1 text-sm text-red-600">{businessForm.formState.errors.address.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Business Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-neutral-800 border-b border-neutral-200 pb-2">
                    Business Settings
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">
                        Tax Rate (%) *
                      </label>
                      <input
                        {...businessForm.register('taxRate', { 
                          valueAsNumber: true,
                          setValueAs: (value) => value === '' ? 0 : parseFloat(value) || 0
                        })}
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        className={`w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent ${
                          businessForm.formState.errors.taxRate ? 'border-red-300' : ''
                        }`}
                        placeholder="0.00"
                      />
                      {businessForm.formState.errors.taxRate && (
                        <p className="mt-1 text-sm text-red-600">{businessForm.formState.errors.taxRate.message}</p>
                      )}
                      <p className="mt-1 text-sm text-neutral-500">Applied to all orders (0-100%)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">
                        Currency *
                      </label>
                      <select
                        {...businessForm.register('currency')}
                        className={`w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent ${
                          businessForm.formState.errors.currency ? 'border-red-300' : ''
                        }`}
                      >
                        {currencies.map(currency => (
                          <option key={currency.code} value={currency.code}>
                            {currency.name}
                          </option>
                        ))}
                      </select>
                      {businessForm.formState.errors.currency && (
                        <p className="mt-1 text-sm text-red-600">{businessForm.formState.errors.currency.message}</p>
                      )}
                      <p className="mt-1 text-sm text-neutral-500">Used for all transactions</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">
                        Timezone *
                      </label>
                      <select
                        {...businessForm.register('timezone')}
                        className={`w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent ${
                          businessForm.formState.errors.timezone ? 'border-red-300' : ''
                        }`}
                      >
                        {timezones.map(tz => (
                          <option key={tz.value} value={tz.value}>
                            {tz.name}
                          </option>
                        ))}
                      </select>
                      {businessForm.formState.errors.timezone && (
                        <p className="mt-1 text-sm text-red-600">{businessForm.formState.errors.timezone.message}</p>
                      )}
                      <p className="mt-1 text-sm text-neutral-500">For date/time display</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving || !businessForm.formState.isValid}
                    className={`btn-primary ${!businessForm.formState.isValid ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {saving ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </div>
                    ) : (
                      'Save Business Settings'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* System Settings Tab */}
          {activeTab === 'system' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gradient flex items-center">
                  <Icon name="settings" className="mr-2" />
                  System Configuration
                </h2>
                <p className="text-sm text-neutral-600 mt-1">
                  Configure system behavior, notifications, and backup settings
                </p>
              </div>
              
              <form onSubmit={systemForm.handleSubmit(saveSystemSettings)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Auto Refresh Interval (seconds) *
                    </label>
                    <input
                      {...systemForm.register('autoRefreshInterval', { valueAsNumber: true })}
                      type="number"
                      min="10"
                      max="300"
                      className={`w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent ${
                        systemForm.formState.errors.autoRefreshInterval ? 'border-red-300' : ''
                      }`}
                      placeholder="30"
                    />
                    {systemForm.formState.errors.autoRefreshInterval && (
                      <p className="mt-1 text-sm text-red-600">{systemForm.formState.errors.autoRefreshInterval.message}</p>
                    )}
                    <p className="mt-1 text-sm text-neutral-500">How often to refresh data automatically (10-300 seconds)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Low Stock Threshold *
                    </label>
                    <input
                      {...systemForm.register('lowStockThreshold', { valueAsNumber: true })}
                      type="number"
                      min="1"
                      max="100"
                      className={`w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent ${
                        systemForm.formState.errors.lowStockThreshold ? 'border-red-300' : ''
                      }`}
                      placeholder="10"
                    />
                    {systemForm.formState.errors.lowStockThreshold && (
                      <p className="mt-1 text-sm text-red-600">{systemForm.formState.errors.lowStockThreshold.message}</p>
                    )}
                    <p className="mt-1 text-sm text-neutral-500">Minimum stock level before alert (1-100)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Maximum Tables *
                    </label>
                    <input
                      {...systemForm.register('maxTables', { valueAsNumber: true })}
                      type="number"
                      min="1"
                      max="100"
                      className={`w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent ${
                        systemForm.formState.errors.maxTables ? 'border-red-300' : ''
                      }`}
                      placeholder="20"
                    />
                    {systemForm.formState.errors.maxTables && (
                      <p className="mt-1 text-sm text-red-600">{systemForm.formState.errors.maxTables.message}</p>
                    )}
                    <p className="mt-1 text-sm text-neutral-500">Maximum number of tables in the system (1-100)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Backup Frequency
                    </label>
                    <select
                      {...systemForm.register('backupFrequency')}
                      disabled={!systemForm.watch('enableAutoBackup')}
                      className={`w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent ${
                        systemForm.formState.errors.backupFrequency ? 'border-red-300' : ''
                      } ${!systemForm.watch('enableAutoBackup') ? 'bg-neutral-100' : ''}`}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                    {systemForm.formState.errors.backupFrequency && (
                      <p className="mt-1 text-sm text-red-600">{systemForm.formState.errors.backupFrequency.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      {...systemForm.register('enableNotifications')}
                      type="checkbox"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-neutral-900">
                      Enable System Notifications
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      {...systemForm.register('enableAutoBackup')}
                      type="checkbox"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-neutral-900">
                      Enable Automatic Backups
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary"
                  >
                    {saving ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </div>
                    ) : (
                      'Save System Settings'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Security Settings Tab */}
          {activeTab === 'security' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gradient flex items-center">
                  <Icon name="security" className="mr-2" />
                  Security Configuration
                </h2>
                <p className="text-sm text-neutral-600 mt-1">
                  Configure security settings and password policies
                </p>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Icon name="warning" className="text-yellow-400" size="lg" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-semibold text-yellow-800">
                      Security Settings
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>These settings control system security and access. Changes may affect all users.</p>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={securityForm.handleSubmit(saveSecuritySettings)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="card-surface p-4">
                    <h3 className="text-md font-semibold text-neutral-900 mb-4">Session Management</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">
                          Session Timeout (minutes)
                        </label>
                        <input
                          {...securityForm.register('sessionTimeout', { valueAsNumber: true })}
                          type="number"
                          min="15"
                          max="480"
                          className={`w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent ${
                            securityForm.formState.errors.sessionTimeout ? 'border-red-300' : ''
                          }`}
                        />
                        {securityForm.formState.errors.sessionTimeout && (
                          <p className="mt-1 text-sm text-red-600">{securityForm.formState.errors.sessionTimeout.message}</p>
                        )}
                        <p className="mt-1 text-sm text-neutral-500">How long before users are logged out (15-480 minutes)</p>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          {...securityForm.register('forceLogoutOnPasswordChange')}
                          type="checkbox"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-neutral-900">
                          Force logout on password change
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="card-surface p-4">
                    <h3 className="text-md font-semibold text-neutral-900 mb-4">Password Policy</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">
                          Minimum Password Length
                        </label>
                        <input
                          {...securityForm.register('minPasswordLength', { valueAsNumber: true })}
                          type="number"
                          min="6"
                          max="20"
                          className={`w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent ${
                            securityForm.formState.errors.minPasswordLength ? 'border-red-300' : ''
                          }`}
                        />
                        {securityForm.formState.errors.minPasswordLength && (
                          <p className="mt-1 text-sm text-red-600">{securityForm.formState.errors.minPasswordLength.message}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          {...securityForm.register('requireUppercase')}
                          type="checkbox"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-neutral-900">
                          Require uppercase letters
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          {...securityForm.register('requireNumbers')}
                          type="checkbox"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-neutral-900">
                          Require numbers
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary"
                  >
                    {saving ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </div>
                    ) : (
                      'Save Security Settings'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Reset Dialog */}
      <ConfirmDialog
        open={showResetDialog}
        title="Reset Settings to Defaults"
        message="This will reset all settings to their default values. This action cannot be undone. Are you sure you want to continue?"
        confirmText={resetLoading ? "Resetting..." : "Reset Settings"}
        cancelText="Cancel"
        icon="warning"
        type="danger"
        onConfirm={resetToDefaults}
        onCancel={() => setShowResetDialog(false)}
        loading={resetLoading}
      />

      {/* Backup Dialog */}
      <ConfirmDialog
        open={showBackupDialog}
        title="Create System Backup"
        message="This will create a backup of all system settings and data. The backup file will be downloaded automatically."
        confirmText={backupLoading ? "Creating..." : "Create Backup"}
        cancelText="Cancel"
        icon="backup"
        type="info"
        onConfirm={createBackup}
        onCancel={() => setShowBackupDialog(false)}
        loading={backupLoading}
      />
    </div>
  );
};

export default Settings; 