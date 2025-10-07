import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Icon from '../common/Icon';

const ShiftManagement = () => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    startTime: '',
    endTime: '',
    gracePeriod: 10,
    description: '',
    isActive: true,
    daysOfWeek: []
  });

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    try {
      const response = await fetch('/api/shifts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setShifts(data.data);
      } else {
        toast.error('Failed to fetch shifts');
      }
    } catch (error) {
      console.error('Error fetching shifts:', error);
      toast.error('Error fetching shifts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingShift ? `/api/shifts/${editingShift.id}` : '/api/shifts';
      const method = editingShift ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setShowModal(false);
        setEditingShift(null);
        setFormData({
          name: '',
          startTime: '',
          endTime: '',
          gracePeriod: 10,
          description: '',
          isActive: true,
          daysOfWeek: []
        });
        fetchShifts();
      } else {
        const error = await response.json();
        toast.error(error.message);
      }
    } catch (error) {
      console.error('Error saving shift:', error);
      toast.error('Error saving shift');
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
    if (!window.confirm('Are you sure you want to delete this shift?')) {
      return;
    }

    try {
      const response = await fetch(`/api/shifts/${shiftId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        fetchShifts();
      } else {
        const error = await response.json();
        toast.error(error.message);
      }
    } catch (error) {
      console.error('Error deleting shift:', error);
      toast.error('Error deleting shift');
    }
  };

  const openModal = () => {
    setEditingShift(null);
    setFormData({
      name: '',
      startTime: '',
      endTime: '',
      gracePeriod: 10,
      description: '',
      isActive: true,
      daysOfWeek: []
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingShift(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
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
                  onClick={() => handleDelete(shift.id)}
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
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="e.g., Morning Shift"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="input"
                    required
                  />
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
                  onChange={(e) => setFormData({ ...formData, gracePeriod: parseInt(e.target.value) })}
                  className="input"
                  placeholder="10"
                />
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
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, daysOfWeek: [...formData.daysOfWeek, day] });
                          } else {
                            setFormData({ ...formData, daysOfWeek: formData.daysOfWeek.filter(d => d !== day) });
                          }
                        }}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-xs text-gray-600 mt-1">{day}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to apply to all days. Select specific days for custom schedules.
                </p>
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
                  className="btn-primary"
                >
                  {editingShift ? 'Update Shift' : 'Create Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftManagement;
