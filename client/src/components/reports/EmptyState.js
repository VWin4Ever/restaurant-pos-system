import React from 'react';

const EmptyState = ({ 
  type, 
  action, 
  actionText, 
  customIcon, 
  customMessage,
  customDescription 
}) => {
  const getEmptyStateConfig = (type) => {
    const configs = {
      'no-data': {
        icon: '📊',
        title: 'No Data Available',
        message: 'There\'s no data to display for the selected period.',
        description: 'Try selecting a different date range or check back later.',
        actionText: 'Refresh Data'
      },
      'no-orders': {
        icon: '🛒',
        title: 'No Orders Found',
        message: 'No orders were found for the selected criteria.',
        description: 'Try adjusting your filters or date range.',
        actionText: 'Clear Filters'
      },
      'no-sales': {
        icon: '💰',
        title: 'No Sales Data',
        message: 'No sales data available for this period.',
        description: 'Sales data will appear once orders are completed.',
        actionText: 'View Orders'
      },
      'no-staff': {
        icon: '👥',
        title: 'No Staff Activity',
        message: 'No staff activity recorded for this period.',
        description: 'Staff activity will appear once they process orders.',
        actionText: 'View Staff'
      },
      'no-inventory': {
        icon: '📦',
        title: 'No Inventory Data',
        message: 'No inventory items found.',
        description: 'Add products to your inventory to see stock reports.',
        actionText: 'Add Products'
      },
      'no-comparison': {
        icon: '📈',
        title: 'No Comparison Data',
        message: 'Insufficient data for period comparison.',
        description: 'Need at least two periods with data to compare.',
        actionText: 'Select Different Period'
      },
      'error': {
        icon: '⚠️',
        title: 'Something Went Wrong',
        message: 'We encountered an error while loading the data.',
        description: 'Please try again or contact support if the issue persists.',
        actionText: 'Try Again'
      },
      'loading': {
        icon: '⏳',
        title: 'Loading Data',
        message: 'Please wait while we fetch your data.',
        description: 'This may take a few moments.',
        actionText: null
      }
    };
    
    return configs[type] || configs['no-data'];
  };

  const config = customMessage ? {
    icon: customIcon || '📊',
    title: 'Custom Message',
    message: customMessage,
    description: customDescription || '',
    actionText: actionText || 'Action'
  } : getEmptyStateConfig(type);

  return (
    <div className="text-center py-16 px-6">
      {/* Icon */}
      <div className="text-8xl mb-6 opacity-60">
        {config.icon}
      </div>
      
      {/* Title */}
      <h3 className="text-2xl font-semibold text-gray-900 mb-3">
        {config.title}
      </h3>
      
      {/* Message */}
      <p className="text-lg text-gray-600 mb-4 max-w-md mx-auto">
        {config.message}
      </p>
      
      {/* Description */}
      {config.description && (
        <p className="text-sm text-gray-500 mb-8 max-w-lg mx-auto">
          {config.description}
        </p>
      )}
      
      {/* Action Button */}
      {config.actionText && action && (
        <button
          onClick={action}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 shadow-sm"
        >
          {config.actionText}
        </button>
      )}
      
      {/* Additional Help */}
      {type === 'error' && (
        <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto">
          <p className="text-sm text-red-700">
            <strong>Need help?</strong> Contact support or check the console for more details.
          </p>
        </div>
      )}
      
      {type === 'loading' && (
        <div className="mt-8">
          <div className="inline-flex items-center space-x-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
