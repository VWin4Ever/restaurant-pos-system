// Simple role-based permissions middleware
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
    'stock.update'
  ]
};

// Check if user has permission
const hasPermission = (userRole, permission) => {
  const userPermissions = ROLE_PERMISSIONS[userRole] || [];
  
  // Check exact permission
  if (userPermissions.includes(permission)) {
    return true;
  }
  
  // Check wildcard permissions (e.g., 'orders.*' matches 'orders.create')
  const [module, action] = permission.split('.');
  const wildcardPermission = `${module}.*`;
  
  return userPermissions.includes(wildcardPermission);
};

// Middleware to require specific permission
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

// Middleware to require any of multiple permissions
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

// Middleware to require all permissions
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

// Check if user can perform action
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