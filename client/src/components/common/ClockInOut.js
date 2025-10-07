import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Icon from './Icon';

const ClockInOut = () => {
  const [shiftStatus, setShiftStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clockingIn, setClockingIn] = useState(false);
  const [clockingOut, setClockingOut] = useState(false);
  const [notes, setNotes] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [closingBalance, setClosingBalance] = useState('');

  useEffect(() => {
    fetchShiftStatus();
    // Refresh status every 5 minutes (reduced from 1 minute)
    const interval = setInterval(fetchShiftStatus, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchShiftStatus = async () => {
    try {
      const response = await fetch('/api/shift-logs/my-status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setShiftStatus(data.data);
      } else {
        console.error('Failed to fetch shift status');
      }
    } catch (error) {
      console.error('Error fetching shift status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    setClockingIn(true);
    try {
      const response = await fetch('/api/shift-logs/clock-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          notes,
          openingBalance: openingBalance ? parseFloat(openingBalance) : undefined
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setNotes('');
        fetchShiftStatus();
      } else {
        const error = await response.json();
        toast.error(error.message);
      }
    } catch (error) {
      console.error('Error clocking in:', error);
      toast.error('Error clocking in');
    } finally {
      setClockingIn(false);
    }
  };

  const handleClockOut = async () => {
    setClockingOut(true);
    try {
      const response = await fetch('/api/shift-logs/clock-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          notes,
          closingBalance: closingBalance ? parseFloat(closingBalance) : undefined
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setNotes('');
        fetchShiftStatus();
      } else {
        const error = await response.json();
        toast.error(error.message);
      }
    } catch (error) {
      console.error('Error clocking out:', error);
      toast.error('Error clocking out');
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

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Shift Status</h3>
        <div className="text-sm text-gray-500">
          Current Time: {getCurrentTime()}
        </div>
      </div>

      {/* Shift Information */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-3 mb-2">
          <Icon name="clock" size="sm" className="text-gray-400" />
          <div>
            <h4 className="font-medium text-gray-900">{shiftStatus.shift.name}</h4>
            <p className="text-sm text-gray-600">
              {shiftStatus.shift.startTime} - {shiftStatus.shift.endTime}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 text-sm">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            shiftStatus.isWithinShiftTime 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {shiftStatus.isWithinShiftTime ? 'Within Shift Time' : 'Outside Shift Time'}
          </span>
          <span className="text-gray-500">
            Grace Period: {shiftStatus.shift.gracePeriod} minutes
          </span>
        </div>
      </div>

      {/* Clock In/Out Status */}
      <div className="mb-6">
        {shiftStatus.isClockedIn ? (
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <Icon name="check-circle" size="sm" className="text-green-600" />
              <div>
                <h4 className="font-medium text-green-800">Clocked In</h4>
                <p className="text-sm text-green-700">
                  Since: {formatTime(shiftStatus.clockInTime)}
                </p>
              </div>
            </div>
            <button
              onClick={handleClockOut}
              disabled={clockingOut}
              className="btn-danger flex items-center space-x-2"
            >
              {clockingOut ? (
                <div className="loading-spinner w-4 h-4"></div>
              ) : (
                <Icon name="logout" size="sm" />
              )}
              <span>Clock Out</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <Icon name="clock" size="sm" className="text-blue-600" />
              <div>
                <h4 className="font-medium text-blue-800">Ready to Clock In</h4>
                <p className="text-sm text-blue-700">
                  {shiftStatus.isWithinShiftTime 
                    ? 'You can clock in now' 
                    : 'Wait for your shift time to clock in'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={handleClockIn}
              disabled={clockingIn || !shiftStatus.isWithinShiftTime}
              className={`flex items-center space-x-2 ${
                shiftStatus.isWithinShiftTime 
                  ? 'btn-primary' 
                  : 'btn-secondary cursor-not-allowed'
              }`}
            >
              {clockingIn ? (
                <div className="loading-spinner w-4 h-4"></div>
              ) : (
                <Icon name="login" size="sm" />
              )}
              <span>Clock In</span>
            </button>
          </div>
        )}
      </div>

      {/* Cash Balance Input */}
      {!shiftStatus.isClockedIn && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Opening Cash Balance (Optional)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={openingBalance}
            onChange={(e) => setOpeningBalance(e.target.value)}
            className="input"
            placeholder="Enter opening cash amount..."
          />
        </div>
      )}

      {shiftStatus.isClockedIn && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Closing Cash Balance (Optional)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={closingBalance}
            onChange={(e) => setClosingBalance(e.target.value)}
            className="input"
            placeholder="Enter closing cash amount..."
          />
        </div>
      )}

      {/* Notes Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input"
          rows="2"
          placeholder="Add any notes about your shift..."
        />
      </div>

      {/* Additional Info */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• You can clock in {shiftStatus.shift.gracePeriod} minutes before your shift starts</p>
        <p>• You can clock out {shiftStatus.shift.gracePeriod} minutes after your shift ends</p>
        <p>• Make sure to clock out when your shift ends</p>
      </div>
    </div>
  );
};

export default ClockInOut;
