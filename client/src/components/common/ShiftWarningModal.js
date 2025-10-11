import React from 'react';
import Icon from './Icon';

const ShiftWarningModal = ({ isOpen, onClose, timeRemaining, shiftInfo }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center p-6 border-b border-gray-200">
          <div className="p-3 bg-yellow-100 rounded-full mr-4">
            <Icon name="clock" size="lg" className="text-yellow-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Shift Ending Soon</h3>
            <p className="text-sm text-gray-600">
              {shiftInfo?.name} - {shiftInfo?.startTime} to {shiftInfo?.endTime}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center">
            <div className="mb-4">
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                {timeRemaining} minutes
              </div>
              <p className="text-gray-600">
                Your shift will end in <strong>{timeRemaining} minutes</strong>. 
                Please complete any pending transactions.
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <Icon name="alert" size="sm" className="text-yellow-600 mr-2 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Important:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Complete all pending orders</li>
                    <li>Process any pending payments</li>
                    <li>Prepare for shift handover if needed</li>
                    <li>You will be automatically logged out at shift end</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShiftWarningModal;

