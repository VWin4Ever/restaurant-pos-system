import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import Icon from '../common/Icon';
import LoadingSpinner from '../common/LoadingSpinner';

const AdminShiftControl = () => {
  const [activeShifts, setActiveShifts] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    userId: '',
    duration: '',
    reason: '',
    notes: ''
  });
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchData();
    // Refresh every 2 minutes (reduced from 30 seconds)
    intervalRef.current = setInterval(fetchData, 120000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [activeResponse, shiftsResponse, usersResponse] = await Promise.all([
        axios.get('/api/shifts/active/status'),
        axios.get('/api/shifts'),
        axios.get('/api/users')
      ]);
      
      setActiveShifts(activeResponse.data.data);
      setShifts(shiftsResponse.data.data);
      setUsers(usersResponse.data.data);
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

  const handleOpenModal = (type, user = null) => {
    setModalType(type);
    setSelectedUser(user);
    setFormData({
      userId: user?.id || '',
      duration: '',
      reason: '',
      notes: ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalType('');
    setSelectedUser(null);
    setFormData({
      userId: '',
      duration: '',
      reason: '',
      notes: ''
    });
  };

  // Log admin override actions
  const logOverrideAction = async (actionType, formData) => {
    try {
      const user = users.find(u => u.id === parseInt(formData.userId));
      const shift = user?.shift;
      
      if (!shift) return;

      const actionMap = {
        'extend': 'EXTEND',
        'force-logout': 'FORCE_LOGOUT'
      };

      const action = actionMap[actionType];
      if (!action) return;

      await axios.post('/api/shift-logs/override', {
        shiftId: shift.id,
        userId: parseInt(formData.userId),
        action,
        reason: formData.reason || 'Admin override action',
        oldValue: null,
        newValue: null,
        notes: formData.notes
      });
    } catch (error) {
      console.error('Error logging override action:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    if (!formData.reason.trim()) {
      toast.error('Reason is required');
      return;
    }
    
    if (modalType === 'extend' && (!formData.duration || parseInt(formData.duration) <= 0)) {
      toast.error('Valid duration is required for shift extension');
      return;
    }
    
    // Change shift validation removed
    
    setActionLoading(true);
    
    try {
      let response;
      const payload = {
        ...formData,
        notes: `${formData.reason}${formData.notes ? ` - ${formData.notes}` : ''}`
      };

      switch (modalType) {
        case 'extend':
          response = await axios.post(`/api/shift-logs/extend/${formData.userId}`, {
            duration: parseInt(formData.duration),
            notes: payload.notes
          });
          break;
        // Change shift functionality removed
        case 'force-logout':
          response = await axios.post(`/api/shift-logs/force-logout/${formData.userId}`, {
            notes: payload.notes
          });
          break;
        default:
          return;
      }

      toast.success(response.data.message);
      
      // Log the override action
      await logOverrideAction(modalType, formData);
      
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error('Error performing admin action:', error);
      const errorMessage = error.response?.status === 400
        ? error.response?.data?.message || 'Invalid action data'
        : error.response?.status === 403
        ? 'You do not have permission to perform this action'
        : error.response?.status === 404
        ? 'User or shift not found'
        : error.response?.data?.message || 'Failed to perform action. Please try again.';
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getDuration = (clockInTime) => {
    if (!clockInTime) return '';
    const now = new Date();
    const clockIn = new Date(clockInTime);
    const diffMs = now - clockIn;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMinutes}m`;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Admin Shift Control</h2>
        <p className="text-gray-600">Manage exceptional shift cases and monitor active staff</p>
      </div>

      {/* Active Shifts Overview */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Currently Active Shifts</h3>
          <div className="flex items-center space-x-2">
            <Icon name="activity" size="sm" className="text-green-600" />
            <span className="text-sm font-medium text-green-600">
              {activeShifts.length} staff clocked in
            </span>
          </div>
        </div>

        {activeShifts.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="clock" size="2xl" className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No staff currently clocked in</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Staff Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shift
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clocked In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeShifts.map((shiftLog) => (
                  <tr key={shiftLog.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-700">
                              {shiftLog.user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{shiftLog.user.name}</div>
                          <div className="text-sm text-gray-500">{shiftLog.user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{shiftLog.shift.name}</div>
                      <div className="text-sm text-gray-500">
                        {shiftLog.shift.startTime} - {shiftLog.shift.endTime}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatTime(shiftLog.clockIn)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getDuration(shiftLog.clockIn)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleOpenModal('extend', shiftLog.user)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Extend shift"
                        >
                          <Icon name="clock" size="sm" />
                        </button>
                        <button
                          onClick={() => handleOpenModal('force-logout', shiftLog.user)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Force logout"
                        >
                          <Icon name="logout" size="sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <Icon name="clock" size="lg" className="text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Extend Shift</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Add extra time to a staff member's current shift
          </p>
          <button
            onClick={() => handleOpenModal('extend')}
            className="btn-primary w-full"
          >
            Extend Shift
          </button>
        </div>


        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <Icon name="logout" size="lg" className="text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">Force Logout</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Manually end a staff member's shift session
          </p>
          <button
            onClick={() => handleOpenModal('force-logout')}
            className="btn-danger w-full"
          >
            Force Logout
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {modalType === 'extend' && 'Extend Shift'}
                {modalType === 'force-logout' && 'Force Logout'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <Icon name="close" size="sm" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {!selectedUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Staff Member
                  </label>
                  <select
                    value={formData.userId}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Choose staff member...</option>
                    {users.filter(user => user.role === 'CASHIER').map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.username})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {modalType === 'extend' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Extension Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="480"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="input"
                    placeholder="30"
                    required
                  />
                </div>
              )}

              {/* Change shift form removed */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
                </label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="input"
                  placeholder="Brief reason for this action..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input"
                  rows="3"
                  placeholder="Optional additional details..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`${
                    modalType === 'force-logout' ? 'btn-danger' : 'btn-primary'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {actionLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <>
                      {modalType === 'extend' && 'Extend Shift'}
                      {modalType === 'force-logout' && 'Force Logout'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminShiftControl;
