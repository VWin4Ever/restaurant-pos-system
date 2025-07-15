import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from 'axios';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';
import ConfirmDialog from '../common/ConfirmDialog';

const businessSchema = yup.object({
  restaurantName: yup.string().required('Restaurant name is required'),
  address: yup.string().required('Address is required'),
  phone: yup.string().required('Phone number is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  taxRate: yup.number().min(0).max(100).required('Tax rate is required'),
  currency: yup.string().required('Currency is required'),
  timezone: yup.string().required('Timezone is required')
}).required();

const systemSchema = yup.object({
  autoRefreshInterval: yup.number().min(10).max(300).required('Auto refresh interval is required'),
  lowStockThreshold: yup.number().min(1).max(100).required('Low stock threshold is required'),
  maxTables: yup.number().min(1).max(100).required('Maximum tables is required'),
  enableNotifications: yup.boolean(),
  enableAutoBackup: yup.boolean(),
  backupFrequency: yup.string().when('enableAutoBackup', {
    is: true,
    then: yup.string().required('Backup frequency is required'),
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
  const [activeTab, setActiveTab] = useState('business');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({});
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showBackupDialog, setShowBackupDialog] = useState(false);

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
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/api/settings');
      const data = response.data.data;
      setSettings(data);
      
      // Set form values
      businessForm.reset({
        restaurantName: data.business?.restaurantName || '',
        address: data.business?.address || '',
        phone: data.business?.phone || '',
        email: data.business?.email || '',
        taxRate: data.business?.taxRate || 0,
        currency: data.business?.currency || 'USD',
        timezone: data.business?.timezone || 'UTC'
      });

      systemForm.reset({
        autoRefreshInterval: data.system?.autoRefreshInterval || 30,
        lowStockThreshold: data.system?.lowStockThreshold || 10,
        maxTables: data.system?.maxTables || 20,
        enableNotifications: data.system?.enableNotifications !== false,
        enableAutoBackup: data.system?.enableAutoBackup || false,
        backupFrequency: data.system?.backupFrequency || 'daily'
      });

      securityForm.reset({
        sessionTimeout: data.security?.sessionTimeout || 1440,
        forceLogoutOnPasswordChange: data.security?.forceLogoutOnPasswordChange !== false,
        minPasswordLength: data.security?.minPasswordLength || 6,
        requireUppercase: data.security?.requireUppercase !== false,
        requireNumbers: data.security?.requireNumbers !== false
      });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveBusinessSettings = async (data) => {
    setSaving(true);
    try {
      await axios.put('/api/settings/business', data);
      toast.success('Business settings saved successfully!');
      fetchSettings();
    } catch (error) {
      console.error('Failed to save business settings:', error);
      toast.error('Failed to save business settings');
    } finally {
      setSaving(false);
    }
  };

  const saveSystemSettings = async (data) => {
    setSaving(true);
    try {
      await axios.put('/api/settings/system', data);
      toast.success('System settings saved successfully!');
      fetchSettings();
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
      fetchSettings();
    } catch (error) {
      console.error('Failed to save security settings:', error);
      toast.error('Failed to save security settings');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    try {
      await axios.post('/api/settings/reset');
      toast.success('Settings reset to defaults successfully!');
      fetchSettings();
      setShowResetDialog(false);
    } catch (error) {
      console.error('Failed to reset settings:', error);
      toast.error('Failed to reset settings');
    }
  };

  const createBackup = async () => {
    try {
      const response = await axios.post('/api/settings/backup');
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

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBackupDialog(true)}
            className="btn-secondary"
          >
            📦 Create Backup
          </button>
          <button
            onClick={() => setShowResetDialog(true)}
            className="btn-danger"
          >
            🔄 Reset to Defaults
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('business')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'business'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🏢 Business Settings
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'system'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            ⚙️ System Settings
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'security'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🔒 Security Settings
          </button>
        </nav>
      </div>

      {/* Business Settings Tab */}
      {activeTab === 'business' && (
        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Business Information</h2>
          <form onSubmit={businessForm.handleSubmit(saveBusinessSettings)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restaurant Name *
                </label>
                <input
                  {...businessForm.register('restaurantName')}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    businessForm.formState.errors.restaurantName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter restaurant name"
                />
                {businessForm.formState.errors.restaurantName && (
                  <p className="mt-1 text-sm text-red-600">{businessForm.formState.errors.restaurantName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  {...businessForm.register('phone')}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    businessForm.formState.errors.phone ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter phone number"
                />
                {businessForm.formState.errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{businessForm.formState.errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  {...businessForm.register('email')}
                  type="email"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    businessForm.formState.errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter email address"
                />
                {businessForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-600">{businessForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Rate (%) *
                </label>
                <input
                  {...businessForm.register('taxRate', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    businessForm.formState.errors.taxRate ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter tax rate"
                />
                {businessForm.formState.errors.taxRate && (
                  <p className="mt-1 text-sm text-red-600">{businessForm.formState.errors.taxRate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency *
                </label>
                <select
                  {...businessForm.register('currency')}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    businessForm.formState.errors.currency ? 'border-red-300' : 'border-gray-300'
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timezone *
                </label>
                <select
                  {...businessForm.register('timezone')}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    businessForm.formState.errors.timezone ? 'border-red-300' : 'border-gray-300'
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
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <textarea
                {...businessForm.register('address')}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  businessForm.formState.errors.address ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter business address"
              />
              {businessForm.formState.errors.address && (
                <p className="mt-1 text-sm text-red-600">{businessForm.formState.errors.address.message}</p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
              >
                {saving ? 'Saving...' : 'Save Business Settings'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* System Settings Tab */}
      {activeTab === 'system' && (
        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">System Configuration</h2>
          <form onSubmit={systemForm.handleSubmit(saveSystemSettings)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto Refresh Interval (seconds) *
                </label>
                <input
                  {...systemForm.register('autoRefreshInterval', { valueAsNumber: true })}
                  type="number"
                  min="10"
                  max="300"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    systemForm.formState.errors.autoRefreshInterval ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="30"
                />
                {systemForm.formState.errors.autoRefreshInterval && (
                  <p className="mt-1 text-sm text-red-600">{systemForm.formState.errors.autoRefreshInterval.message}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">How often to refresh data automatically (10-300 seconds)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Low Stock Threshold *
                </label>
                <input
                  {...systemForm.register('lowStockThreshold', { valueAsNumber: true })}
                  type="number"
                  min="1"
                  max="100"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    systemForm.formState.errors.lowStockThreshold ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="10"
                />
                {systemForm.formState.errors.lowStockThreshold && (
                  <p className="mt-1 text-sm text-red-600">{systemForm.formState.errors.lowStockThreshold.message}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">Minimum stock level before alert (1-100)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Tables *
                </label>
                <input
                  {...systemForm.register('maxTables', { valueAsNumber: true })}
                  type="number"
                  min="1"
                  max="100"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    systemForm.formState.errors.maxTables ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="20"
                />
                {systemForm.formState.errors.maxTables && (
                  <p className="mt-1 text-sm text-red-600">{systemForm.formState.errors.maxTables.message}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">Maximum number of tables in the system (1-100)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Backup Frequency
                </label>
                <select
                  {...systemForm.register('backupFrequency')}
                  disabled={!systemForm.watch('enableAutoBackup')}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    systemForm.formState.errors.backupFrequency ? 'border-red-300' : 'border-gray-300'
                  } ${!systemForm.watch('enableAutoBackup') ? 'bg-gray-100' : ''}`}
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
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Enable System Notifications
                </label>
              </div>

              <div className="flex items-center">
                <input
                  {...systemForm.register('enableAutoBackup')}
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
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
                {saving ? 'Saving...' : 'Save System Settings'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Security Settings Tab */}
      {activeTab === 'security' && (
        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Security Configuration</h2>
          
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-yellow-400 text-xl">⚠️</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Security Settings
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>These settings control system security and access. Changes may affect all users.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card p-4">
                <h3 className="text-md font-medium text-gray-900 mb-4">Session Management</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Session Timeout (minutes)
                    </label>
                    <input
                      type="number"
                      min="15"
                      max="480"
                      defaultValue="1440"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">How long before users are logged out (15-480 minutes)</p>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Force logout on password change
                    </label>
                  </div>
                </div>
              </div>

              <div className="card p-4">
                <h3 className="text-md font-medium text-gray-900 mb-4">Password Policy</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Password Length
                    </label>
                    <input
                      type="number"
                      min="6"
                      max="20"
                      defaultValue="6"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Require uppercase letters
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Require numbers
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button className="btn-primary">
                Save Security Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Dialog */}
      <ConfirmDialog
        open={showResetDialog}
        title="Reset Settings to Defaults"
        message="This will reset all settings to their default values. This action cannot be undone. Are you sure you want to continue?"
        confirmText="Reset Settings"
        cancelText="Cancel"
        icon="⚠️"
        onConfirm={resetToDefaults}
        onCancel={() => setShowResetDialog(false)}
      />

      {/* Backup Dialog */}
      <ConfirmDialog
        open={showBackupDialog}
        title="Create System Backup"
        message="This will create a backup of all system settings and data. The backup file will be downloaded automatically."
        confirmText="Create Backup"
        cancelText="Cancel"
        icon="📦"
        onConfirm={createBackup}
        onCancel={() => setShowBackupDialog(false)}
      />
    </div>
  );
};

export default Settings; 