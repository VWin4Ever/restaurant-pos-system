const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Define permissions for each role
const ROLE_PERMISSIONS = {
  ADMIN: [
    // User Management
    'users.view',
    'users.create',
    'users.edit',
    'users.delete',
    'users.reset-password',
    
    // Product Management
    'products.view',
    'products.create',
    'products.edit',
    'products.delete',
    'products.import',
    'products.export',
    
    // Category Management
    'categories.view',
    'categories.create',
    'categories.edit',
    'categories.delete',
    
    // Stock Management
    'stock.view',
    'stock.adjust',
    'stock.logs',
    
    // Order Management
    'orders.view',
    'orders.create',
    'orders.edit',
    'orders.delete',
    'orders.cancel',
    'orders.complete',
    'orders.process-payment',
    
    // Table Management
    'tables.view',
    'tables.create',
    'tables.edit',
    'tables.delete',
    'tables.change-status',
    
    // Reports
    'reports.view',
    'reports.export',
    'reports.analytics',
    
    // Settings
    'settings.view',
    'settings.edit',
    'settings.backup',
    'settings.reset',
    
    // System
    'system.dashboard',
    'system.notifications'
  ],
  
  CASHIER: [
    // Order Management (limited)
    'orders.view',
    'orders.create',
    'orders.edit',
    'orders.complete',
    'orders.process-payment',
    
    // Table Management (limited)
    'tables.view',
    'tables.change-status',
    
    // Product Management (view only)
    'products.view',
    
    // Category Management (view only)
    'categories.view',
    
    // System
    'system.dashboard'
  ]
};

// Check if user has specific permission
const hasPermission = (userRole, permission) => {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
};

// Middleware to check specific permission
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({
        success: false,
        message: `Insufficient permissions. Required: ${permission}`
      });
    }

    next();
  };
};

// Middleware to check multiple permissions (any of them)
const requireAnyPermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const hasAnyPermission = permissions.some(permission => 
      hasPermission(req.user.role, permission)
    );

    if (!hasAnyPermission) {
      return res.status(403).json({
        success: false,
        message: `Insufficient permissions. Required one of: ${permissions.join(', ')}`
      });
    }

    next();
  };
};

// Middleware to check multiple permissions (all of them)
const requireAllPermissions = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const hasAllPermissions = permissions.every(permission => 
      hasPermission(req.user.role, permission)
    );

    if (!hasAllPermissions) {
      return res.status(403).json({
        success: false,
        message: `Insufficient permissions. Required all: ${permissions.join(', ')}`
      });
    }

    next();
  };
};

// Get user permissions
const getUserPermissions = (userRole) => {
  return ROLE_PERMISSIONS[userRole] || [];
};

// Check if user can perform action on resource
const canPerformAction = (userRole, action, resource) => {
  const permission = `${resource}.${action}`;
  return hasPermission(userRole, permission);
};

module.exports = {
  hasPermission,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  getUserPermissions,
  canPerformAction,
  ROLE_PERMISSIONS
}; 