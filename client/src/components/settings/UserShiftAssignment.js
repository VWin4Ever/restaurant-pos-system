import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import Icon from '../common/Icon';
import LoadingSpinner from '../common/LoadingSpinner';
import ConfirmDialog from '../common/ConfirmDialog';

const UserShiftAssignment = () => {
  const [users, setUsers] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersResponse, shiftsResponse] = await Promise.all([
        axios.get('/api/users'),
        axios.get('/api/shifts')
      ]);
      
      // Only show cashiers in shift assignment
      setUsers(usersResponse.data.data.filter(user => user.role === 'CASHIER'));
      setShifts(shiftsResponse.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      const errorMessage = error.response?.status === 403 
        ? 'You do not have permission to view this data'
        : error.response?.status >= 500
        ? 'Server error. Please try again later.'
        : 'Failed to fetch data. Please check your connection.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleShiftAssignment = async (userId, shiftId) => {
    setActionLoading(true);
    try {
      const response = await axios.post(`/api/shifts/${shiftId}/assign`, { userId });
      toast.success(response.data.message);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error assigning shift:', error);
      const errorMessage = error.response?.status === 400
        ? error.response?.data?.message || 'Invalid assignment data'
        : error.response?.status === 403
        ? 'You do not have permission to assign shifts'
        : error.response?.status === 404
        ? 'Shift or user not found'
        : 'Failed to assign shift. Please try again.';
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveShift = async (userId, shiftId) => {
    setActionLoading(true);
    try {
      const response = await axios.delete(`/api/shifts/${shiftId}/assign/${userId}`);
      toast.success(response.data.message);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error removing shift:', error);
      const errorMessage = error.response?.status === 400
        ? error.response?.data?.message || 'User is not assigned to this shift'
        : error.response?.status === 403
        ? 'You do not have permission to remove shift assignments'
        : error.response?.status === 404
        ? 'Shift or user not found'
        : 'Failed to remove shift assignment. Please try again.';
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveShiftAssignment = (user) => {
    setConfirmDialog({
      open: true,
      title: 'Remove Shift Assignment',
      message: `Are you sure you want to remove ${user.name} from their current shift "${user.shift.name}"?`,
      confirmText: 'Remove',
      cancelText: 'Cancel',
      icon: 'delete',
      type: 'warning',
      userId: user.id,
      shiftId: user.shift.id
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">User Shift Assignment</h2>
        <p className="text-gray-600">Assign shifts to staff members</p>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Staff Members</h3>
        </div>
        
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
                  Current Shift
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-700">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'ADMIN' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.shift ? (
                      <div className="flex items-center space-x-2">
                        <Icon name="clock" size="sm" className="text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.shift.name}</div>
                          <div className="text-xs text-gray-500">
                            {user.shift.startTime} - {user.shift.endTime}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No shift assigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {user.shift ? (
                        <button
                          onClick={() => handleRemoveShiftAssignment(user)}
                          disabled={actionLoading}
                          className="text-red-600 hover:text-red-900 p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Remove from shift"
                        >
                          <Icon name="delete" size="sm" />
                        </button>
                      ) : (
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              handleShiftAssignment(user.id, e.target.value);
                            }
                          }}
                          disabled={actionLoading}
                          className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          defaultValue=""
                        >
                          <option value="">Assign Shift</option>
                          {shifts.filter(shift => shift.isActive).map((shift) => (
                            <option key={shift.id} value={shift.id}>
                              {shift.name} ({shift.startTime} - {shift.endTime})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {users.length === 0 && (
        <div className="text-center py-12">
          <Icon name="users" size="2xl" className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No cashiers found</h3>
          <p className="text-gray-600">Create cashier users first to assign shifts</p>
        </div>
      )}

      {/* Shift Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {shifts.map((shift) => {
          const assignedUsers = users.filter(user => user.shift?.id === shift.id);
          return (
            <div key={shift.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{shift.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  shift.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {shift.isActive ? 'Active' : 'Inactive'}
                </span>
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
                  <Icon name="users" size="sm" className="text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {assignedUsers.length} assigned
                    </p>
                    <p className="text-xs text-gray-500">Staff Members</p>
                  </div>
                </div>

                {assignedUsers.length > 0 && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-500 mb-2">Assigned Staff:</p>
                    <div className="space-y-1">
                      {assignedUsers.map((user) => (
                        <div key={user.id} className="flex items-center space-x-2">
                          <div className="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-xs font-medium text-primary-700">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-xs text-gray-700">{user.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

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
          handleRemoveShift(confirmDialog.userId, confirmDialog.shiftId);
          setConfirmDialog({ open: false });
        }}
        onCancel={() => setConfirmDialog({ open: false })}
      />
    </div>
  );
};

export default UserShiftAssignment;
