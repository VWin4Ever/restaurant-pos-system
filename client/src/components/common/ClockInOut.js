import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import Icon from './Icon';
import { useAuth } from '../../contexts/AuthContext';
import ShiftEndModal from './ShiftEndModal';
import ShiftWarningModal from './ShiftWarningModal';

const ClockInOut = ({ compact = false }) => {
  const { user } = useAuth();
  const [shiftStatus, setShiftStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clockingIn, setClockingIn] = useState(false);
  const [clockingOut, setClockingOut] = useState(false);
  const [notes, setNotes] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [closingBalance, setClosingBalance] = useState('');
  const [showShiftEndModal, setShowShiftEndModal] = useState(false);
  const [showShiftWarning, setShowShiftWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    fetchShiftStatus();
    // Refresh status every 5 minutes (reduced from 1 minute)
    const interval = setInterval(fetchShiftStatus, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchShiftStatus = async () => {
    try {
      const response = await axios.get('/api/shift-logs/my-status');
      const data = response.data.data;
      setShiftStatus(data);
      
      // Check for shift warning (10 minutes before end)
      if (data?.shift && data?.isClockedIn) {
        checkShiftWarning(data.shift);
      }
    } catch (error) {
      console.error('Error fetching shift status:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkShiftWarning = (shift) => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    const shiftEndTime = shift.endTime;
    
    // Convert times to minutes for comparison
    const timeToMinutes = (timeString) => {
      const [hours, minutes] = timeString.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    const currentMinutes = timeToMinutes(currentTime);
    const endMinutes = timeToMinutes(shiftEndTime);
    
    // Calculate time remaining
    let timeRemainingMinutes = endMinutes - currentMinutes;
    
    // Handle overnight shifts
    if (endMinutes < currentMinutes) {
      timeRemainingMinutes = (24 * 60) - currentMinutes + endMinutes;
    }
    
    // Show warning if 10 minutes or less remaining
    if (timeRemainingMinutes <= 10 && timeRemainingMinutes > 0) {
      setTimeRemaining(timeRemainingMinutes);
      setShowShiftWarning(true);
    }
  };

  const handleClockIn = async () => {
    setClockingIn(true);
    try {
      const response = await axios.post('/api/shift-logs/clock-in', {
        notes,
        openingBalance: openingBalance ? parseFloat(openingBalance) : undefined
      });

      toast.success(response.data.message);
      setNotes('');
      setOpeningBalance('');
      fetchShiftStatus();
    } catch (error) {
      console.error('Error clocking in:', error);
      toast.error(error.response?.data?.message || 'Error clocking in');
    } finally {
      setClockingIn(false);
    }
  };

  const handleClockOut = () => {
    // Show shift end confirmation modal instead of directly clocking out
    setShowShiftEndModal(true);
  };

  const handleConfirmClockOut = async (clockOutData) => {
    setClockingOut(true);
    try {
      const response = await axios.post('/api/shift-logs/clock-out', {
        notes: clockOutData.notes,
        closingBalance: clockOutData.closingBalance
      });

      toast.success(response.data.message);
      setNotes('');
      setClosingBalance('');
      setShowShiftEndModal(false);
      fetchShiftStatus();
    } catch (error) {
      console.error('Error clocking out:', error);
      
      // Handle early clock-out restriction
      if (error.response?.data?.errorCode === 'EARLY_CLOCK_OUT_RESTRICTED') {
        const shiftInfo = error.response.data.shiftInfo;
        toast.error(
          `Cannot clock out early. Your shift ends at ${shiftInfo.endTime}. Please contact an admin for permission.`,
          { autoClose: 8000 }
        );
      } else {
        toast.error(error.response?.data?.message || 'Error clocking out');
      }
    } finally {
      setClockingOut(false);
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

  // Check if clock-out is restricted (before shift ends)
  const isClockOutRestricted = () => {
    if (!shiftStatus?.shift || user?.role === 'ADMIN') return false;
    
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    const shiftEndTime = shiftStatus.shift.endTime;
    
    return currentTime < shiftEndTime;
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // Admins don't need to see any shift status - they have full access
  if (user?.role === 'ADMIN') {
    return null;
  }

  // Cashiers need shift assignment
  if (!shiftStatus?.hasShift) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <Icon name="warning" size="sm" className="text-yellow-600 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">No Shift Assigned</h3>
            <p className="text-sm text-yellow-700">Please contact your administrator to assign a shift.</p>
          </div>
        </div>
      </div>
    );
  }

  // Ultra-compact version for header
  if (compact) {
    // Admins don't need to see any shift status
    if (user?.role === 'ADMIN') {
      return null;
    }

    return (
      <div className="flex items-center space-x-3 bg-white rounded-lg shadow-sm border border-gray-200 px-3 py-2">
        <div className="flex items-center space-x-2">
          <Icon name="clock" size="sm" className="text-gray-400" />
          <span className="text-sm font-medium text-gray-700">{shiftStatus.shift.name}</span>
          <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
            shiftStatus.isWithinShiftTime 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {shiftStatus.isWithinShiftTime ? 'Active' : 'Inactive'}
          </span>
        </div>

        {shiftStatus.isClockedIn ? (
          <div className="flex items-center space-x-2">
            <Icon name="check-circle" size="sm" className="text-green-600" />
            <span className="text-xs text-green-700">In</span>
            <button
              onClick={handleClockOut}
              disabled={clockingOut || isClockOutRestricted()}
              className={`px-2 py-1 text-white text-xs rounded disabled:opacity-50 ${
                isClockOutRestricted() 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
              title={isClockOutRestricted() ? 'Cannot clock out before shift ends' : ''}
            >
              {clockingOut ? '...' : 'Out'}
            </button>
          </div>
        ) : (
          <button
            onClick={handleClockIn}
            disabled={clockingIn || !shiftStatus.isWithinShiftTime}
            className={`px-2 py-1 text-xs rounded ${
              shiftStatus.isWithinShiftTime 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {clockingIn ? '...' : 'In'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Icon name="clock" size="sm" className="text-gray-400" />
          <span className="text-sm font-medium text-gray-700">{shiftStatus.shift.name}</span>
          <span className="text-xs text-gray-500">
            {shiftStatus.shift.startTime} - {shiftStatus.shift.endTime}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          {getCurrentTime()}
        </div>
      </div>

      {/* Status and Action */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            shiftStatus.isWithinShiftTime 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {shiftStatus.isWithinShiftTime ? 'Within Time' : 'Outside Time'}
          </span>
          
          {shiftStatus.isClockedIn ? (
            <div className="flex items-center space-x-2">
              <Icon name="check-circle" size="sm" className="text-green-600" />
              <span className="text-sm text-green-700">
                In since {formatTime(shiftStatus.clockInTime)}
              </span>
            </div>
          ) : (
            <span className="text-sm text-gray-600">
              {shiftStatus.isWithinShiftTime ? 'Ready to clock in' : 'Wait for shift time'}
            </span>
          )}
        </div>

        {/* Compact Action Button */}
        {shiftStatus.isClockedIn ? (
          <button
            onClick={handleClockOut}
            disabled={clockingOut || isClockOutRestricted()}
            className={`px-3 py-1.5 text-white text-sm rounded-md disabled:opacity-50 flex items-center space-x-1 ${
              isClockOutRestricted() 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
            title={isClockOutRestricted() ? 'Cannot clock out before shift ends' : ''}
          >
            {clockingOut ? (
              <div className="loading-spinner w-3 h-3"></div>
            ) : (
              <Icon name="logout" size="sm" />
            )}
            <span>Out</span>
          </button>
        ) : (
          <button
            onClick={handleClockIn}
            disabled={clockingIn || !shiftStatus.isWithinShiftTime}
            className={`px-3 py-1.5 text-sm rounded-md flex items-center space-x-1 ${
              shiftStatus.isWithinShiftTime 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {clockingIn ? (
              <div className="loading-spinner w-3 h-3"></div>
            ) : (
              <Icon name="login" size="sm" />
            )}
            <span>In</span>
          </button>
        )}
      </div>

      {/* Optional Cash Balance - Only show when needed */}
      {!shiftStatus.isClockedIn && (
        <div className="mt-3">
          <input
            type="number"
            step="0.01"
            min="0"
            value={openingBalance}
            onChange={(e) => setOpeningBalance(e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
            placeholder="Opening cash (optional)..."
          />
        </div>
      )}

      {shiftStatus.isClockedIn && (
        <div className="mt-3">
          <input
            type="number"
            step="0.01"
            min="0"
            value={closingBalance}
            onChange={(e) => setClosingBalance(e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
            placeholder="Closing cash (optional)..."
          />
        </div>
      )}

      {/* Compact Notes */}
      <div className="mt-2">
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
          placeholder="Notes (optional)..."
        />
      </div>

      {/* Shift End Confirmation Modal */}
      <ShiftEndModal
        isOpen={showShiftEndModal}
        onClose={() => setShowShiftEndModal(false)}
        onConfirm={handleConfirmClockOut}
        shiftInfo={shiftStatus?.shift}
        userId={user?.id}
      />

      {/* Shift Warning Modal */}
      <ShiftWarningModal
        isOpen={showShiftWarning}
        onClose={() => setShowShiftWarning(false)}
        timeRemaining={timeRemaining}
        shiftInfo={shiftStatus?.shift}
      />
    </div>
  );
};

export default ClockInOut;
