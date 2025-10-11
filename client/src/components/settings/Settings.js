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
  vatRate: yup.number()
    .min(0, 'VAT rate cannot be negative')
    .max(100, 'VAT rate cannot exceed 100%')
    .required('VAT rate is required'),
  exchangeRate: yup.number()
    .min(0.01, 'Exchange rate must be greater than 0')
    .max(100000, 'Exchange rate cannot exceed 100,000')
    .required('Exchange rate is required')
}).required();

const systemSchema = yup.object({
  autoRefreshInterval: yup.number().min(10).max(300).required('Auto refresh interval is required'),
  lowStockThreshold: yup.number().min(1).max(100).required('Low stock threshold is required'),
  enableNotifications: yup.boolean(),
  enableAutoBackup: yup.boolean(),
  backupFrequency: yup.string().test('backup-frequency-required', 'Backup frequency is required when auto backup is enabled', function(value) {
    const { enableAutoBackup } = this.parent;
    if (enableAutoBackup && !value) {
      return this.createError({ message: 'Backup frequency is required when auto backup is enabled' });
    }
    return true;
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
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [backupStatus, setBackupStatus] = useState(null);
  const [backupFile, setBackupFile] = useState(null);

  const businessForm = useForm({
    resolver: yupResolver(businessSchema),
    defaultValues: {
      restaurantName: '',
      address: '',
      phone: '',
      email: '',
      vatRate: 10.0, // Updated to 10% as requested
      exchangeRate: 4100.0 // Default exchange rate: 1 USD = 4100 Riel
    }
  });

  const systemForm = useForm({
    resolver: yupResolver(systemSchema),
    defaultValues: {
      autoRefreshInterval: 30,
      lowStockThreshold: 10,
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
        vatRate: globalSettings.business?.vatRate || 0,
        exchangeRate: globalSettings.business?.exchangeRate || 4100.0
      });

      systemForm.reset({
        autoRefreshInterval: globalSettings.system?.autoRefreshInterval || 30,
        lowStockThreshold: globalSettings.system?.lowStockThreshold || 10,
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

  // Fetch backup status
  useEffect(() => {
    fetchBackupStatus();
  }, []);

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
      // Refresh global settings and backup status
      await fetchGlobalSettings();
      await fetchBackupStatus();
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

  const fetchBackupStatus = async () => {
    try {
      const response = await axios.get('/api/settings/backup/status');
      setBackupStatus(response.data.data);
    } catch (error) {
      console.error('Failed to fetch backup status:', error);
    }
  };

  const createBackup = async () => {
    setBackupLoading(true);
    try {
      const response = await axios.post('/api/settings/backup', {});
      
      // Handle the new response format
      const { backupFile, backupPath, backupSizeMB } = response.data;
      
      toast.success(`Database backup created successfully! Saved to: ${backupFile} (${backupSizeMB} MB)`);
      setShowBackupDialog(false);
      
      // Refresh backup status
      await fetchBackupStatus();
    } catch (error) {
      console.error('Failed to create backup:', error);
      if (error.response?.data?.message) {
        toast.error('Failed to create backup: ' + error.response.data.message);
      } else {
        toast.error('Failed to create backup');
      }
    } finally {
      setBackupLoading(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setBackupFile(file);
    }
  };

  const restoreFromBackup = async () => {
    if (!backupFile) {
      toast.error('Please select a backup file');
      return;
    }

    setRestoreLoading(true);
    try {
      const fileContent = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(backupFile);
      });

      const backupData = JSON.parse(fileContent);
      
      const response = await axios.post('/api/settings/restore', {
        backupData
      });
      
      if (response.data.success) {
        toast.success('System restored successfully!');
        setShowRestoreDialog(false);
        setBackupFile(null);
        
        // Refresh all data
        await fetchGlobalSettings();
        await fetchBackupStatus();
        
        // Refresh the page to reload all data
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to restore backup:', error);
      toast.error('Failed to restore backup: ' + (error.response?.data?.message || error.message));
    } finally {
      setRestoreLoading(false);
    }
  };


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
                <>
                  <button
                    onClick={() => setShowBackupDialog(true)}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <Icon name="backup" size="sm" />
                    <span>Create Backup</span>
                  </button>
                  <button
                    onClick={() => setShowRestoreDialog(true)}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <Icon name="restore" size="sm" />
                    <span>Restore Backup</span>
                  </button>
                </>
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

        {/* Backup Status Dashboard */}
        {backupStatus && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${backupStatus.autoBackup?.enabled ? 'bg-green-500' : 'bg-gray-400'}`}>
                    {backupStatus.autoBackup?.enabled && (
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Auto-backup: {backupStatus.autoBackup?.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    {backupStatus.autoBackup?.enabled && (
                      <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                        {backupStatus.autoBackup.frequency}
                      </span>
                    )}
                  </div>
                </div>
                
                {backupStatus.lastBackup && (
                  <div className="flex items-center space-x-2">
                    <Icon name="backup" size="sm" className="text-gray-500" />
                    <div>
                      <span className="text-sm text-gray-600">Last backup:</span>
                      <span className="ml-1 text-sm font-medium text-gray-700">
                        {new Date(backupStatus.lastBackup.created).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
                
              </div>
              
            </div>
          </div>
        )}

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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">
                        VAT Rate (%) *
                      </label>
                      <input
                        {...businessForm.register('vatRate', { 
                          valueAsNumber: true,
                          setValueAs: (value) => value === '' ? 0 : parseFloat(value) || 0
                        })}
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        className={`w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent ${
                          businessForm.formState.errors.vatRate ? 'border-red-300' : ''
                        }`}
                        placeholder="0.00"
                      />
                      {businessForm.formState.errors.vatRate && (
                        <p className="mt-1 text-sm text-red-600">{businessForm.formState.errors.vatRate.message}</p>
                      )}
                      <p className="mt-1 text-sm text-neutral-500">Applied to all orders (0-100%)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">
                        Exchange Rate (1 USD = X Riel) *
                      </label>
                      <input
                        {...businessForm.register('exchangeRate', { 
                          valueAsNumber: true,
                          setValueAs: (value) => value === '' ? 0 : parseFloat(value) || 0
                        })}
                        type="number"
                        step="0.01"
                        min="0.01"
                        max="100000"
                        className={`w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent ${
                          businessForm.formState.errors.exchangeRate ? 'border-red-300' : ''
                        }`}
                        placeholder="4100.00"
                      />
                      {businessForm.formState.errors.exchangeRate && (
                        <p className="mt-1 text-sm text-red-600">{businessForm.formState.errors.exchangeRate.message}</p>
                      )}
                      <p className="mt-1 text-sm text-neutral-500">Current exchange rate for USD to Riel conversion</p>
                    </div>
                  </div>
                </div>


                <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    {businessForm.formState.isValid ? (
                      <div className="flex items-center space-x-2 text-green-600">
                        <Icon name="check" size="sm" />
                        <span className="text-sm font-medium">All fields valid</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-amber-600">
                        <Icon name="warning" size="sm" />
                        <span className="text-sm font-medium">
                          {Object.keys(businessForm.formState.errors).length} validation error(s)
                        </span>
                      </div>
                    )}
                  </div>
                  
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
                      <div className="flex items-center space-x-2">
                        <Icon name="save" size="sm" />
                        <span>Save Business Settings</span>
                      </div>
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

                <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    {systemForm.formState.isValid ? (
                      <div className="flex items-center space-x-2 text-green-600">
                        <Icon name="check" size="sm" />
                        <span className="text-sm font-medium">All fields valid</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-amber-600">
                        <Icon name="warning" size="sm" />
                        <span className="text-sm font-medium">
                          {Object.keys(systemForm.formState.errors).length} validation error(s)
                        </span>
                      </div>
                    )}
                  </div>
                  
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
                      <div className="flex items-center space-x-2">
                        <Icon name="save" size="sm" />
                        <span>Save System Settings</span>
                      </div>
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

                <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    {securityForm.formState.isValid ? (
                      <div className="flex items-center space-x-2 text-green-600">
                        <Icon name="check" size="sm" />
                        <span className="text-sm font-medium">All fields valid</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-amber-600">
                        <Icon name="warning" size="sm" />
                        <span className="text-sm font-medium">
                          {Object.keys(securityForm.formState.errors).length} validation error(s)
                        </span>
                      </div>
                    )}
                  </div>
                  
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
                      <div className="flex items-center space-x-2">
                        <Icon name="save" size="sm" />
                        <span>Save Security Settings</span>
                      </div>
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
        title="Create Database Backup"
        message="This will create a full SQL database backup and save it to the configured backup directory. The backup file will be stored locally on the server."
        confirmText={backupLoading ? "Creating..." : "Create Backup"}
        cancelText="Cancel"
        icon="backup"
        type="info"
        onConfirm={createBackup}
        onCancel={() => setShowBackupDialog(false)}
        loading={backupLoading}
      />

      {/* Restore Dialog */}
      <ConfirmDialog
        open={showRestoreDialog}
        title="Restore from Backup"
        message={
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              This will restore all system data from a backup file. <strong>This action cannot be undone and will replace all current data.</strong>
            </p>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Select Backup File
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {backupFile && (
                <p className="text-sm text-green-600">
                  Selected: {backupFile.name}
                </p>
              )}
            </div>
          </div>
        }
        confirmText={restoreLoading ? "Restoring..." : "Restore Backup"}
        cancelText="Cancel"
        icon="restore"
        type="danger"
        onConfirm={restoreFromBackup}
        onCancel={() => {
          setShowRestoreDialog(false);
          setBackupFile(null);
        }}
        loading={restoreLoading}
      />
    </div>
  );
};

export default Settings; 