import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Icon from '../common/Icon';

const UserShiftAssignment = () => {
  const [users, setUsers] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersResponse, shiftsResponse] = await Promise.all([
        fetch('/api/users', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }),
        fetch('/api/shifts', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
      ]);

      if (usersResponse.ok && shiftsResponse.ok) {
        const usersData = await usersResponse.json();
        const shiftsData = await shiftsResponse.json();
        
        // Only show cashiers in shift assignment
        setUsers(usersData.data.filter(user => user.role === 'CASHIER'));
        setShifts(shiftsData.data);
      } else {
        toast.error('Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handleShiftAssignment = async (userId, shiftId) => {
    try {
      const response = await fetch(`/api/shifts/${shiftId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        fetchData(); // Refresh data
      } else {
        const error = await response.json();
        toast.error(error.message);
      }
    } catch (error) {
      console.error('Error assigning shift:', error);
      toast.error('Error assigning shift');
    }
  };

  const handleRemoveShift = async (userId, shiftId) => {
    if (!window.confirm('Are you sure you want to remove this user from their shift?')) {
      return;
    }

    try {
      const response = await fetch(`/api/shifts/${shiftId}/assign/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        fetchData(); // Refresh data
      } else {
        const error = await response.json();
        toast.error(error.message);
      }
    } catch (error) {
      console.error('Error removing shift:', error);
      toast.error('Error removing shift');
    }
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
                          onClick={() => handleRemoveShift(user.id, user.shift.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
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
                          className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
    </div>
  );
};

export default UserShiftAssignment;
