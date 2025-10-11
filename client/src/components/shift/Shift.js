import React, { useState } from 'react';
import ShiftManagement from '../settings/ShiftManagement';
import UserShiftAssignment from '../settings/UserShiftAssignment';
import AdminShiftControl from '../settings/AdminShiftControl';
import ErrorBoundary from '../common/ErrorBoundary';
import Icon from '../common/Icon';

const Shift = () => {
  const [activeTab, setActiveTab] = useState('shifts');

  const tabs = [
    { id: 'shifts', name: 'Shift Settings', icon: 'clock' },
    { id: 'assignment', name: 'User Assignment', icon: 'users' },
    { id: 'control', name: 'Admin Control', icon: 'settings' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Shift Management</h1>
            <p className="text-gray-600 mt-1">Manage shifts, assign staff, and control shift operations</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors duration-200`}
              >
                <Icon name={tab.icon} size="sm" className="text-lg" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <ErrorBoundary fallbackMessage="Failed to load shift management. Please try refreshing the page.">
            {activeTab === 'shifts' && <ShiftManagement />}
            {activeTab === 'assignment' && <UserShiftAssignment />}
            {activeTab === 'control' && <AdminShiftControl />}
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};

export default Shift;
