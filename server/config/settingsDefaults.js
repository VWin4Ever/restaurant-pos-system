// Shared default settings constants
// Used by both backend and frontend to ensure consistency

const DEFAULT_SETTINGS = {
  business: {
    restaurantName: 'Restaurant POS',
    address: '123 Main Street, City, State 12345',
    phone: '+1 (555) 123-4567',
    email: 'info@restaurant.com',
    vatRate: 10.0, // Updated to 10% as requested
    exchangeRate: 4100.0 // Default exchange rate: 1 USD = 4100 Riel
  },
  system: {
    autoRefreshInterval: 30,
    lowStockThreshold: 10,
    enableNotifications: true,
    enableAutoBackup: false,
    backupFrequency: 'daily'
  },
  security: {
    sessionTimeout: 1440, // 24 hours in minutes
    forceLogoutOnPasswordChange: true,
    minPasswordLength: 6,
    requireUppercase: true,
    requireNumbers: true
  }
};

module.exports = DEFAULT_SETTINGS;
