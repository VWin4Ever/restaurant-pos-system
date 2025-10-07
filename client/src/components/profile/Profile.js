import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import axios from 'axios';
import Icon from '../common/Icon';

const passwordSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup.string().min(6, 'Password must be at least 6 characters').required('New password is required'),
  confirmPassword: yup.string().oneOf([yup.ref('newPassword'), null], 'Passwords must match').required('Confirm password is required')
}).required();

const profileSchema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email format').required('Email is required')
}).required();

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [passwordStrength, setPasswordStrength] = useState(0);

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword
  } = useForm({
    resolver: yupResolver(passwordSchema)
  });

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile
  } = useForm({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || ''
    }
  });

  const onSubmitPassword = async (data) => {
    setIsChangingPassword(true);
    try {
      await axios.post('/api/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      
      resetPassword();
      toast.success('Password changed successfully!');
    } catch (error) {
      console.error('Password change failed:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const onSubmitProfile = async (data) => {
    setIsUpdatingProfile(true);
    try {
      const response = await axios.put('/api/auth/profile', data);
      updateUser(response.data.data);
      resetProfile({
        name: response.data.data.name,
        email: response.data.data.email
      });
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Profile update failed:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      ADMIN: 'bg-red-100 text-red-800',
      CASHIER: 'bg-blue-100 text-blue-800'
    };
    return badges[role] || 'bg-gray-100 text-gray-800';
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 6) strength += 20;
    if (password.length >= 8) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 20;
    if (/[^A-Za-z0-9]/.test(password)) strength += 20;
    return strength;
  };

  const getPasswordStrengthColor = (strength) => {
    if (strength < 40) return 'bg-red-500';
    if (strength < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = (strength) => {
    if (strength < 40) return 'Weak';
    if (strength < 70) return 'Medium';
    return 'Strong';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <nav className="flex space-x-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'profile'
                ? 'bg-primary-50 text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Icon name="user" className="w-4 h-4" />
            <span>Profile Information</span>
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'password'
                ? 'bg-primary-50 text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Icon name="lock" className="w-4 h-4" />
            <span>Change Password</span>
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'activity'
                ? 'bg-primary-50 text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Icon name="activity" className="w-4 h-4" />
            <span>Account Activity</span>
          </button>
        </nav>
      </div>

      {/* Profile Information Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* User Information Display */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <div className="flex-shrink-0">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg">
                  <span className="text-2xl font-bold text-white">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              </div>
              <div className="ml-6">
                <h3 className="text-xl font-semibold text-gray-900">{user?.name}</h3>
                <p className="text-sm text-gray-500 flex items-center">
                  <Icon name="at" className="w-4 h-4 mr-1" />
                  @{user?.username}
                </p>
                <div className="mt-2 flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(user?.role)}`}>
                    <Icon name="shield" className="w-3 h-3 mr-1" />
                    {user?.role}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user?.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    <Icon name={user?.isActive ? "check-circle" : "x-circle"} className="w-3 h-3 mr-1" />
                    {user?.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Icon name="info" className="w-5 h-5 mr-2 text-primary-600" />
                Account Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Icon name="at" className="w-4 h-4 mr-2 text-gray-500" />
                    Username
                  </label>
                  <p className="text-sm text-gray-900 font-medium">{user?.username}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Icon name="user" className="w-4 h-4 mr-2 text-gray-500" />
                    Full Name
                  </label>
                  <p className="text-sm text-gray-900 font-medium">{user?.name}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Icon name="mail" className="w-4 h-4 mr-2 text-gray-500" />
                    Email
                  </label>
                  <p className="text-sm text-gray-900 font-medium">{user?.email || 'Not provided'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Icon name="shield" className="w-4 h-4 mr-2 text-gray-500" />
                    Role
                  </label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(user?.role)}`}>
                    {user?.role}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Icon name="activity" className="w-4 h-4 mr-2 text-gray-500" />
                    Account Status
                  </label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user?.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    <Icon name={user?.isActive ? "check-circle" : "x-circle"} className="w-3 h-3 mr-1" />
                    {user?.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Icon name="calendar" className="w-4 h-4 mr-2 text-gray-500" />
                    Member Since
                  </label>
                  <p className="text-sm text-gray-900 font-medium">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Profile Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                <Icon name="edit" className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Update Profile</h3>
                <p className="text-sm text-gray-500">Modify your personal information</p>
              </div>
            </div>
            
            <form onSubmit={handleProfileSubmit(onSubmitProfile)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Icon name="user" className="w-4 h-4 mr-2 text-gray-500" />
                    Full Name *
                  </label>
                  <input
                    {...registerProfile('name')}
                    type="text"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                      profileErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                    placeholder="Enter your full name"
                  />
                  {profileErrors.name && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <Icon name="alert-circle" className="w-4 h-4 mr-1" />
                      {profileErrors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Icon name="mail" className="w-4 h-4 mr-2 text-gray-500" />
                    Email Address *
                  </label>
                  <input
                    {...registerProfile('email')}
                    type="email"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                      profileErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                    placeholder="Enter your email address"
                  />
                  {profileErrors.email && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <Icon name="alert-circle" className="w-4 h-4 mr-1" />
                      {profileErrors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isUpdatingProfile ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Icon name="save" className="w-4 h-4" />
                      <span>Update Profile</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Tab */}
      {activeTab === 'password' && (
        <div className="space-y-6">
          {/* Password Requirements */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <Icon name="shield" className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Password Security Guidelines</h3>
                <p className="text-sm text-gray-500">Follow these guidelines for a secure password</p>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Icon name="info" className="h-5 w-5 text-blue-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">Password Requirements</h3>
                  <div className="text-sm text-blue-700">
                    <ul className="space-y-1">
                      <li className="flex items-center">
                        <Icon name="check" className="w-4 h-4 mr-2 text-green-500" />
                        Minimum 6 characters long
                      </li>
                      <li className="flex items-center">
                        <Icon name="check" className="w-4 h-4 mr-2 text-green-500" />
                        Use a combination of letters, numbers, and symbols
                      </li>
                      <li className="flex items-center">
                        <Icon name="check" className="w-4 h-4 mr-2 text-green-500" />
                        Avoid using personal information
                      </li>
                      <li className="flex items-center">
                        <Icon name="check" className="w-4 h-4 mr-2 text-green-500" />
                        Don't reuse passwords from other accounts
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Change Password Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                <Icon name="lock" className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                <p className="text-sm text-gray-500">Update your account password</p>
              </div>
            </div>
            
            <form onSubmit={handlePasswordSubmit(onSubmitPassword)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Icon name="lock" className="w-4 h-4 mr-2 text-gray-500" />
                  Current Password *
                </label>
                <input
                  {...registerPassword('currentPassword')}
                  type="password"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                    passwordErrors.currentPassword ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  placeholder="Enter your current password"
                />
                {passwordErrors.currentPassword && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <Icon name="alert-circle" className="w-4 h-4 mr-1" />
                    {passwordErrors.currentPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Icon name="key" className="w-4 h-4 mr-2 text-gray-500" />
                  New Password *
                </label>
                <input
                  {...registerPassword('newPassword')}
                  type="password"
                  onChange={(e) => setPasswordStrength(calculatePasswordStrength(e.target.value))}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                    passwordErrors.newPassword ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  placeholder="Enter your new password"
                />
                
                {/* Password Strength Meter */}
                <div className="mt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Password strength:</span>
                    <span className={`font-medium ${
                      passwordStrength < 40 ? 'text-red-600' : 
                      passwordStrength < 70 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {getPasswordStrengthText(passwordStrength)}
                    </span>
                  </div>
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength)}`}
                      style={{ width: `${passwordStrength}%` }}
                    ></div>
                  </div>
                </div>
                
                {passwordErrors.newPassword && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <Icon name="alert-circle" className="w-4 h-4 mr-1" />
                    {passwordErrors.newPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Icon name="check-circle" className="w-4 h-4 mr-2 text-gray-500" />
                  Confirm New Password *
                </label>
                <input
                  {...registerPassword('confirmPassword')}
                  type="password"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                    passwordErrors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  placeholder="Confirm your new password"
                />
                {passwordErrors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <Icon name="alert-circle" className="w-4 h-4 mr-1" />
                    {passwordErrors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isChangingPassword ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Changing...</span>
                    </>
                  ) : (
                    <>
                      <Icon name="save" className="w-4 h-4" />
                      <span>Change Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Activity Tab */}
      {activeTab === 'activity' && (
        <div className="space-y-6">
          {/* Account Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                <Icon name="activity" className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Account Summary</h3>
                <p className="text-sm text-gray-500">Overview of your account activity</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-4 text-center">
                <div className="h-12 w-12 rounded-full bg-primary-500 flex items-center justify-center mx-auto mb-3">
                  <Icon name="calendar" className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-primary-700">
                  {user?.createdAt ? Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)) : 0}
                </div>
                <div className="text-sm text-primary-600 font-medium">Days Active</div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center">
                <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-3">
                  <Icon name={user?.isActive ? "check-circle" : "x-circle"} className="w-6 h-6 text-white" />
                </div>
                <div className="text-lg font-bold text-green-700">
                  {user?.isActive ? 'Active' : 'Inactive'}
                </div>
                <div className="text-sm text-green-600 font-medium">Account Status</div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
                <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center mx-auto mb-3">
                  <Icon name="shield" className="w-6 h-6 text-white" />
                </div>
                <div className="text-lg font-bold text-blue-700">
                  {user?.role}
                </div>
                <div className="text-sm text-blue-600 font-medium">User Role</div>
              </div>
            </div>
          </div>

          {/* Security Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
                <Icon name="shield-check" className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Security Information</h3>
                <p className="text-sm text-gray-500">Your account security details</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Icon name="calendar" className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Account Created</p>
                    <p className="text-sm text-gray-500">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="ml-2 text-sm text-gray-500 font-medium">Verified</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Icon name="edit" className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Last Profile Update</p>
                    <p className="text-sm text-gray-500">
                      {user?.updatedAt ? new Date(user.updatedAt).toLocaleString() : 'Never'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="ml-2 text-sm text-gray-500 font-medium">Updated</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Icon name="login" className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Last Login</p>
                    <p className="text-sm text-gray-500">
                      {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="ml-2 text-sm text-gray-500 font-medium">Recent</span>
                </div>
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                <Icon name="settings" className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Account Actions</h3>
                <p className="text-sm text-gray-500">Manage your account settings</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => setActiveTab('password')}
                className="w-full flex items-center justify-between px-6 py-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group"
              >
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Icon name="lock" className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">Change Password</p>
                    <p className="text-sm text-gray-500">Update your account password for security</p>
                  </div>
                </div>
                <Icon name="chevron-right" className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </button>

              <button
                onClick={() => setActiveTab('profile')}
                className="w-full flex items-center justify-between px-6 py-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group"
              >
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Icon name="edit" className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">Edit Profile</p>
                    <p className="text-sm text-gray-500">Update your personal information</p>
                  </div>
                </div>
                <Icon name="chevron-right" className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile; 