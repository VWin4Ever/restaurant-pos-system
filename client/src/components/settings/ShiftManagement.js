import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import Icon from '../common/Icon';
import LoadingSpinner from '../common/LoadingSpinner';
import ConfirmDialog from '../common/ConfirmDialog';

const ShiftManagement = () => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false });
  const [formData, setFormData] = useState({
    name: '',
    startTime: '',
    endTime: '',
    gracePeriod: 10,
    description: '',
    isActive: true,
    daysOfWeek: []
  });
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/shifts');
      setShifts(response.data.data);
    } catch (error) {
      console.error('Error fetching shifts:', error);
      const errorMessage = error.response?.status === 403 
        ? 'You do not have permission to view shifts'
        : error.response?.status === 404
        ? 'Shifts endpoint not found'
        : error.response?.status >= 500
        ? 'Server error. Please try again later.'
        : 'Failed to fetch shifts. Please check your connection.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Real-time validation
  // Helper function to convert time string to minutes
  const timeToMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Helper function to check if two time ranges overlap
  const shiftsOverlap = (start1, end1, start2, end2) => {
    const start1Minutes = timeToMinutes(start1);
    const end1Minutes = timeToMinutes(end1);
    const start2Minutes = timeToMinutes(start2);
    const end2Minutes = timeToMinutes(end2);

    // Handle overnight shifts
    const isOvernight1 = start1Minutes > end1Minutes;
    const isOvernight2 = start2Minutes > end2Minutes;

    if (isOvernight1 && isOvernight2) {
      // Both are overnight shifts
      return (start1Minutes <= end2Minutes) || (start2Minutes <= end1Minutes);
    } else if (isOvernight1) {
      // First shift is overnight
      return (start1Minutes <= end2Minutes) || (end1Minutes >= start2Minutes);
    } else if (isOvernight2) {
      // Second shift is overnight
      return (start2Minutes <= end1Minutes) || (end2Minutes >= start1Minutes);
    } else {
      // Both are regular shifts
      return start1Minutes < end2Minutes && start2Minutes < end1Minutes;
    }
  };

  // Check for shift overlap with existing shifts
  const checkShiftOverlap = (startTime, endTime, daysOfWeek) => {
    if (!startTime || !endTime) return null;

    for (const shift of shifts) {
      // Skip the shift being edited
      if (editingShift && shift.id === editingShift.id) continue;

      const shiftDays = shift.daysOfWeek ? JSON.parse(shift.daysOfWeek) : null;
      
      // Check if shifts have overlapping days
      if (daysOfWeek && daysOfWeek.length > 0 && shiftDays && shiftDays.length > 0) {
        const hasOverlappingDays = daysOfWeek.some(day => shiftDays.includes(day));
        if (!hasOverlappingDays) continue;
      } else if ((daysOfWeek && daysOfWeek.length > 0) || (shiftDays && shiftDays.length > 0)) {
        // One shift has specific days, other doesn't - assume overlap
        continue;
      }

      // Check time overlap
      if (shiftsOverlap(startTime, endTime, shift.startTime, shift.endTime)) {
        return `Shift time overlaps with existing "${shift.name}" shift (${shift.startTime} - ${shift.endTime})`;
      }
    }

    return null; // No overlap found
  };

  const validateField = (field, value) => {
    const errors = { ...validationErrors };
    
    switch (field) {
      case 'name':
        if (!value.trim()) {
          errors.name = 'Shift name is required';
        } else if (value.trim().length < 2) {
          errors.name = 'Shift name must be at least 2 characters';
        } else if (value.trim().length > 50) {
          errors.name = 'Shift name must be less than 50 characters';
        } else {
          delete errors.name;
        }
        break;
      case 'startTime':
        if (!value) {
          errors.startTime = 'Start time is required';
        } else if (formData.endTime && value === formData.endTime) {
          errors.startTime = 'Start time and end time cannot be the same';
        } else {
          delete errors.startTime;
        }
        break;
      case 'endTime':
        if (!value) {
          errors.endTime = 'End time is required';
        } else if (formData.startTime && value === formData.startTime) {
          errors.endTime = 'Start time and end time cannot be the same';
        } else {
          delete errors.endTime;
        }
        break;
      case 'gracePeriod':
        const gracePeriod = parseInt(value);
        if (isNaN(gracePeriod) || gracePeriod < 0) {
          errors.gracePeriod = 'Grace period must be a positive number';
        } else if (gracePeriod > 60) {
          errors.gracePeriod = 'Grace period cannot exceed 60 minutes';
        } else {
          delete errors.gracePeriod;
        }
        break;
      default:
        break;
    }
    
    // Shift overlap validation disabled - allowing overlapping shifts
    // if ((field === 'startTime' || field === 'endTime' || field === 'daysOfWeek') && 
    //     formData.startTime && formData.endTime) {
    //   const overlapError = checkShiftOverlap(
    //     field === 'startTime' ? value : formData.startTime,
    //     field === 'endTime' ? value : formData.endTime,
    //     field === 'daysOfWeek' ? value : formData.daysOfWeek
    //   );
    //   
    //   if (overlapError) {
    //     errors.shiftOverlap = overlapError;
    //   } else {
    //     delete errors.shiftOverlap;
    //   }
    // }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const handleDaysOfWeekChange = (day, checked) => {
    const newDaysOfWeek = checked 
      ? [...formData.daysOfWeek, day]
      : formData.daysOfWeek.filter(d => d !== day);
    
    setFormData(prev => ({ ...prev, daysOfWeek: newDaysOfWeek }));
    validateField('daysOfWeek', newDaysOfWeek);
  };

  const validateForm = () => {
    const fields = ['name', 'startTime', 'endTime', 'gracePeriod'];
    let isValid = true;
    
    fields.forEach(field => {
      if (!validateField(field, formData[field])) {
        isValid = false;
      }
    });

    // Shift overlap validation disabled - allowing overlapping shifts
    // if (formData.startTime && formData.endTime) {
    //   const overlapError = checkShiftOverlap(formData.startTime, formData.endTime, formData.daysOfWeek);
    //   if (overlapError) {
    //     setValidationErrors(prev => ({ ...prev, shiftOverlap: overlapError }));
    //     isValid = false;
    //   }
    // }
    
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the validation errors before submitting');
      return;
    }
    
    setActionLoading(true);
    
    try {
      let response;
      if (editingShift) {
        response = await axios.put(`/api/shifts/${editingShift.id}`, formData);
      } else {
        response = await axios.post('/api/shifts', formData);
      }
      
      toast.success(response.data.message);
      setShowModal(false);
      setEditingShift(null);
      resetForm();
      fetchShifts();
    } catch (error) {
      console.error('Error saving shift:', error);
      const errorMessage = error.response?.status === 409
        ? 'Shift name already exists'
        : error.response?.status === 403
        ? 'You do not have permission to perform this action'
        : error.response?.status === 400
        ? error.response?.data?.message || 'Invalid shift data provided'
        : error.response?.data?.message || 'Failed to save shift. Please try again.';
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (shift) => {
    setEditingShift(shift);
    setFormData({
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      gracePeriod: shift.gracePeriod,
      description: shift.description || '',
      isActive: shift.isActive,
      daysOfWeek: shift.daysOfWeek ? JSON.parse(shift.daysOfWeek) : []
    });
    setShowModal(true);
  };

  const handleDelete = async (shiftId) => {
    try {
      await axios.delete(`/api/shifts/${shiftId}`);
      toast.success('Shift deleted successfully');
      fetchShifts();
    } catch (error) {
      console.error('Error deleting shift:', error);
      const errorMessage = error.response?.status === 400
        ? error.response?.data?.message || 'Cannot delete shift with assigned users'
        : error.response?.status === 403
        ? 'You do not have permission to delete shifts'
        : error.response?.status === 404
        ? 'Shift not found'
        : 'Failed to delete shift. Please try again.';
      toast.error(errorMessage);
    }
  };

  const handleDeleteShift = (shift) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Shift',
      message: `Are you sure you want to delete shift "${shift.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      icon: 'delete',
      type: 'danger',
      shiftId: shift.id
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      startTime: '',
      endTime: '',
      gracePeriod: 10,
      description: '',
      isActive: true,
      daysOfWeek: []
    });
    setValidationErrors({});
  };

  const openModal = () => {
    setEditingShift(null);
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingShift(null);
    resetForm();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Shift Management</h2>
          <p className="text-gray-600">Create and manage restaurant shifts</p>
        </div>
        <button
          onClick={openModal}
          className="btn-primary flex items-center space-x-2"
        >
          <Icon name="add" size="sm" />
          <span>Add Shift</span>
        </button>
      </div>

      {/* Shifts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shifts.map((shift) => (
          <div key={shift.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{shift.name}</h3>
                <p className="text-sm text-gray-600">{shift.description}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(shift)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit shift"
                >
                  <Icon name="edit" size="sm" />
                </button>
                <button
                  onClick={() => handleDeleteShift(shift)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete shift"
                >
                  <Icon name="delete" size="sm" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Icon name="clock" size="sm" className="text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {shift.startTime} - {shift.endTime}
                  </p>
                  <p className="text-xs text-gray-500">Shift Hours</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Icon name="shield" size="sm" className="text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {shift.gracePeriod} minutes
                  </p>
                  <p className="text-xs text-gray-500">Grace Period</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Icon name="users" size="sm" className="text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {shift._count?.users || 0} assigned
                  </p>
                  <p className="text-xs text-gray-500">Staff Members</p>
                </div>
              </div>

              {shift.daysOfWeek && (
                <div className="flex items-center space-x-3">
                  <Icon name="calendar" size="sm" className="text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {JSON.parse(shift.daysOfWeek).join(', ')}
                    </p>
                    <p className="text-xs text-gray-500">Days of Week</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  shift.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {shift.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {shifts.length === 0 && (
        <div className="text-center py-12">
          <Icon name="clock" size="2xl" className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No shifts created</h3>
          <p className="text-gray-600 mb-4">Create your first shift to get started</p>
          <button
            onClick={openModal}
            className="btn-primary"
          >
            Create Shift
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingShift ? 'Edit Shift' : 'Create New Shift'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <Icon name="close" size="sm" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shift Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`input ${validationErrors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="e.g., Morning Shift"
                  required
                />
                {validationErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleInputChange('startTime', e.target.value)}
                    className={`input ${validationErrors.startTime ? 'border-red-500 focus:ring-red-500' : ''}`}
                    required
                  />
                  {validationErrors.startTime && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.startTime}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => handleInputChange('endTime', e.target.value)}
                    className={`input ${validationErrors.endTime ? 'border-red-500 focus:ring-red-500' : ''}`}
                    required
                  />
                  {validationErrors.endTime && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.endTime}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grace Period (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={formData.gracePeriod}
                  onChange={(e) => handleInputChange('gracePeriod', e.target.value)}
                  className={`input ${validationErrors.gracePeriod ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="10"
                />
                {validationErrors.gracePeriod && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.gracePeriod}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Allow login this many minutes before/after shift time
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Days of Week (Optional)
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => (
                    <label key={day} className="flex flex-col items-center">
                      <input
                        type="checkbox"
                        checked={formData.daysOfWeek.includes(day)}
                        onChange={(e) => handleDaysOfWeekChange(day, e.target.checked)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-xs text-gray-600 mt-1">{day}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to apply to all days. Select specific days for custom schedules.
                </p>
                {/* Shift overlap error display disabled - allowing overlapping shifts */}
                {/* {validationErrors.shiftOverlap && (
                  <p className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded-md border border-red-200">
                    <strong>Shift Overlap:</strong> {validationErrors.shiftOverlap}
                  </p>
                )} */}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows="3"
                  placeholder="Optional description..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  Active
                </label>
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
                  disabled={actionLoading || Object.keys(validationErrors).length > 0}
                  className="btn-primary"
                >
                  {actionLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{editingShift ? 'Updating...' : 'Creating...'}</span>
                    </div>
                  ) : (
                    editingShift ? 'Update Shift' : 'Create Shift'
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
          handleDelete(confirmDialog.shiftId);
          setConfirmDialog({ open: false });
        }}
        onCancel={() => setConfirmDialog({ open: false })}
      />
    </div>
  );
};

export default ShiftManagement;
