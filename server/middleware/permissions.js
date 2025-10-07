// Enhanced role-based permissions middleware with custom user permissions
const prisma = require('../utils/database');

// Permission cache to reduce database queries
const permissionCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const ROLE_PERMISSIONS = {
  ADMIN: [
    'orders.*',
    'products.*',
    'categories.*',
    'tables.*',
    'stock.*',
    'reports.*',
    'settings.*',
    'users.*'
  ],
  CASHIER: [
    'orders.create',
    'orders.read',
    'orders.update',
    'products.view',
    'categories.view',
    'tables.read',
    'tables.update',
    'stock.read',
    'stock.update',
    'reports.view',
    'settings.view'
  ]
};

// Cache helper functions
const getCachedPermissions = (userId) => {
  const cached = permissionCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.permissions;
  }
  return null;
};

const setCachedPermissions = (userId, permissions) => {
  permissionCache.set(userId, {
    permissions,
    timestamp: Date.now()
  });
};

const clearUserCache = (userId) => {
  permissionCache.delete(userId);
};

// Check if user has permission (including custom permissions)
const hasPermission = async (userId, userRole, permission) => {
  // Admin has all permissions
  if (userRole === 'ADMIN') {
    return true;
  }

  // Check role-based permissions
  const userPermissions = ROLE_PERMISSIONS[userRole] || [];
  
  // Check exact permission
  if (userPermissions.includes(permission)) {
    return true;
  }
  
  // Check wildcard permissions (e.g., 'orders.*' matches 'orders.create')
  const [module, action] = permission.split('.');
  const wildcardPermission = `${module}.*`;
  
  if (userPermissions.includes(wildcardPermission)) {
    return true;
  }

  // Check custom user permissions from database (with caching)
  try {
    // Try to get cached permissions first
    let customPermissions = getCachedPermissions(userId);
    
    if (!customPermissions) {
      // Fetch from database if not cached
      const dbPermissions = await prisma.userPermission.findMany({
        where: { userId: userId },
        select: { permission: true }
      });
      customPermissions = dbPermissions.map(p => p.permission);
      setCachedPermissions(userId, customPermissions);
    }

    // Check if user has the specific permission
    if (customPermissions.includes(permission)) {
      return true;
    }

    // Check wildcard custom permissions
    if (customPermissions.includes(wildcardPermission)) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking custom permissions:', error);
    return false;
  }
};

// Synchronous version for middleware (uses cached permissions)
const hasPermissionSync = (userRole, permission, customPermissions = []) => {
  // Admin has all permissions
  if (userRole === 'ADMIN') {
    return true;
  }

  // Check role-based permissions
  const userPermissions = ROLE_PERMISSIONS[userRole] || [];
  
  // Check exact permission
  if (userPermissions.includes(permission)) {
    return true;
  }
  
  // Check wildcard permissions
  const [module, action] = permission.split('.');
  const wildcardPermission = `${module}.*`;
  
  if (userPermissions.includes(wildcardPermission)) {
    return true;
  }

  // Check custom permissions
  if (customPermissions.includes(permission)) {
    return true;
  }

  if (customPermissions.includes(wildcardPermission)) {
    return true;
  }

  return false;
};

// Middleware to require specific permission
const requirePermission = (permission) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const hasAccess = await hasPermission(req.user.id, req.user.role, permission);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: `Insufficient permissions. Required: ${permission}`
      });
    }

    next();
  };
};

// Middleware to require any of multiple permissions
const requireAnyPermission = (permissions) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    for (const permission of permissions) {
      const hasAccess = await hasPermission(req.user.id, req.user.role, permission);
      if (hasAccess) {
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      message: `Insufficient permissions. Required one of: ${permissions.join(', ')}`
    });
  };
};

// Middleware to require all permissions
const requireAllPermissions = (permissions) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    for (const permission of permissions) {
      const hasAccess = await hasPermission(req.user.id, req.user.role, permission);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: `Insufficient permissions. Required: ${permission}`
        });
      }
    }

    next();
  };
};

// Get user permissions (role-based + custom)
const getUserPermissions = async (userId, userRole) => {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  
  try {
    // Try to get cached permissions first
    let customPermissions = getCachedPermissions(userId);
    
    if (!customPermissions) {
      // Fetch from database if not cached
      const dbPermissions = await prisma.userPermission.findMany({
        where: { userId },
        select: { permission: true }
      });
      customPermissions = dbPermissions.map(p => p.permission);
      setCachedPermissions(userId, customPermissions);
    }
    
    return [...new Set([...rolePermissions, ...customPermissions])];
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return rolePermissions;
  }
};

// Get available permissions for assignment
const getAvailablePermissions = () => {
  return [
    // Orders
    'orders.create',
    'orders.read',
    'orders.update',
    'orders.delete',
    'orders.*',
    
    // Products
    'products.create',
    'products.read',
    'products.update',
    'products.delete',
    'products.*',
    
    // Categories
    'categories.create',
    'categories.read',
    'categories.update',
    'categories.delete',
    'categories.*',
    
    // Tables
    'tables.create',
    'tables.read',
    'tables.update',
    'tables.delete',
    'tables.*',
    
    // Stock
    'stock.create',
    'stock.read',
    'stock.update',
    'stock.delete',
    'stock.*',
    
    // Reports
    'reports.read',
    'reports.*',
    
    // Settings
    'settings.read',
    'settings.update',
    'settings.*',
    
    // Users (limited for cashiers)
    'users.read',
    'users.create',
    'users.update',
    'users.delete',
    'users.*'
  ];
};

// Check if user can perform action
const canPerformAction = async (userId, userRole, action, resource) => {
  const permission = `${resource}.${action}`;
  return await hasPermission(userId, userRole, permission);
};

module.exports = {
  hasPermission,
  hasPermissionSync,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  getUserPermissions,
  getAvailablePermissions,
  canPerformAction,
  clearUserCache,
  ROLE_PERMISSIONS
}; 