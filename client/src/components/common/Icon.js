import React from 'react';

const CustomIcon = ({ name, size = 'md', className = '', color = 'currentColor', src, alt = '' }) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
    '2xl': 'w-12 h-12',
  };

  // If you provide a src (image path), use that instead of the icon name
  if (src) {
    return (
      <img 
        src={src} 
        alt={alt || name} 
        className={`${sizeClasses[size]} ${className}`}
        style={{ color }}
      />
    );
  }

  // Complete custom icons mapping - all your uploaded icons
  const customIcons = {
    // Navigation icons
    home: '/icons/home.svg',
    orders: '/icons/orders.svg',
    tables: '/icons/tables.svg',
    products: '/icons/products.svg',
    categories: '/icons/categories.svg',
    stock: '/icons/stock.svg',
    users: '/icons/users.svg',
    reports: '/icons/reports.svg',
    settings: '/icons/settings.svg',
    profile: '/icons/profile.svg',
    dashboard: '/icons/dashboard.svg',
    
    // Action icons
    add: '/icons/add.svg',
    edit: '/icons/edit.svg',
    delete: '/icons/delete.svg',
    search: '/icons/search.svg',
    filter: '/icons/filter.svg',
    close: '/icons/close.svg',
    menu: '/icons/menu.svg',
    save: '/icons/save.svg',
    refresh: '/icons/refresh.svg',
    download: '/icons/download.svg',
    upload: '/icons/upload.svg',
    
    // Status icons
    check: '/icons/check.svg',
    warning: '/icons/warning.svg',
    error: '/icons/error.svg',
    'check-circle': '/icons/check-circle.svg',
    'x-circle': '/icons/x-circle.svg',
    'alert-circle': '/icons/alert-circle.svg',
    
    // Finance icons
    money: '/icons/money.svg',
    financial: '/icons/financial.svg',
    sales: '/icons/sales.svg',
    
    // Time icons
    clock: '/icons/clock.svg',
    calendar: '/icons/calendar.svg',
    
    // Arrow icons
    'chevron-right': '/icons/chevron-right.svg',
    'chevron-left': '/icons/chevron-left.svg',
    'chevron-down': '/icons/chevron-down.svg',
    'chevron-up': '/icons/chevron-up.svg',
    
    // UI icons
    eye: '/icons/eye.svg',
    'eye-off': '/icons/eye-off.svg',
    grid: '/icons/grid.svg',
    list: '/icons/list.svg',
    
    // Food and restaurant icons
    food: '/icons/food.svg',
    restaurant: '/icons/restaurant.svg',
    
    // Receipt and order icons
    receipt: '/icons/receipt.svg',
    cart: '/icons/cart.svg',
    
    // Document icons
    document: '/icons/document.svg',
    
    // Location and contact icons
    location: '/icons/location.svg',
    phone: '/icons/phone.svg',
    email: '/icons/email.svg',
    at: '/icons/at.svg',
    
    // Security icons
    lock: '/icons/lock.svg',
    key: '/icons/key.svg',
    shield: '/icons/shield.svg',
    'shield-circle': '/icons/shield-circle.svg',
    security: '/icons/security.svg',
    
    // Business icons
    business: '/icons/business.svg',
    backup: '/icons/backup.svg',
    reset: '/icons/reset.svg',
    activity: '/icons/activity.svg',
    
    // Authentication icons
    login: '/icons/login.svg',
    logout: '/icons/logout.svg',
    
    // Additional mappings for common variations
    table: '/icons/tables.svg',
    category: '/icons/categories.svg',
    user: '/icons/users.svg',
    plus: '/icons/add.svg',
    minus: '/icons/minus.svg',
    trash: '/icons/delete.svg',
    alert: '/icons/warning.svg',
    info: '/icons/check.svg',
    star: '/icons/check.svg',
    currency: '/icons/money.svg',
    creditCard: '/icons/money.svg',
    payment: '/icons/money.svg',
    note: '/icons/document.svg',
    mail: '/icons/email.svg',
    link: '/icons/at.svg',
    box: '/icons/cart.svg',
    clipboard: '/icons/document.svg',
    status: '/icons/activity.svg',
    quantity: '/icons/cart.svg',
    calculator: '/icons/money.svg',
    total: '/icons/money.svg',
    tax: '/icons/money.svg',
    discount: '/icons/money.svg',
    print: '/icons/document.svg',
    heart: '/icons/check.svg',
    chevronRight: '/icons/chevron-right.svg',
    chevronLeft: '/icons/chevron-left.svg',
    chevronDown: '/icons/chevron-down.svg',
    chevronUp: '/icons/chevron-up.svg',
    'shield-check': '/icons/shield-circle.svg',
    
    // Missing icons - using existing icons as fallbacks
    restore: '/icons/refresh.svg',
    database: '/icons/backup.svg',
  };

  const iconPath = customIcons[name];
  
  if (!iconPath) {
    console.warn(`Custom icon "${name}" not found. Please add it to the customIcons object.`);
    return null;
  }

  // Create a CSS filter to change icon color and normalize style
  const getColorFilter = (color) => {
    if (color === 'currentColor' || !color) {
      return 'none';
    }
    
    // Convert color to filter
    if (color === 'white' || color === '#ffffff' || color === '#fff') {
      return 'brightness(0) invert(1)';
    } else if (color === 'black' || color === '#000000' || color === '#000') {
      return 'brightness(0)';
    } else if (color === '#e5e7eb' || color === '#d1d5db') {
      // Light gray colors - make them white
      return 'brightness(0) invert(1)';
    } else if (color === '#1f2937' || color === '#374151') {
      // Dark gray colors - keep them dark
      return 'brightness(0)';
    } else if (color.includes('#')) {
      // For other hex colors, try to make them lighter
      return 'brightness(0) invert(1)';
    }
    
    return 'none';
  };

  // Normalize icon styles for consistency
  const getStyleNormalization = (iconName) => {
    // Icons that are too complex or detailed - apply smoothing
    const complexIcons = ['orders', 'receipt', 'document', 'business', 'financial', 'cart', 'restaurant'];
    
    // Icons that are too thin - apply slight thickening
    const thinIcons = ['home', 'chevron-right', 'chevron-left', 'chevron-up', 'chevron-down', 'eye', 'eye-off'];
    
    // Icons that are too bold/heavy - apply lightening
    const heavyIcons = ['settings', 'shield', 'lock', 'key', 'security'];
    
    let filters = [];
    
    if (complexIcons.includes(iconName)) {
      // Smooth out complex icons and reduce visual weight
      filters.push('contrast(0.9)', 'brightness(1.1)', 'saturate(0.8)');
    }
    
    if (thinIcons.includes(iconName)) {
      // Slightly thicken thin icons
      filters.push('contrast(1.3)', 'brightness(0.95)');
    }
    
    if (heavyIcons.includes(iconName)) {
      // Lighten heavy icons
      filters.push('contrast(0.8)', 'brightness(1.2)');
    }
    
    // Apply consistent visual weight for all icons
    filters.push('opacity(0.85)');
    
    return filters.length > 0 ? filters.join(' ') : 'opacity(0.85)';
  };

  return (
    <img 
      src={iconPath} 
      alt={alt || name} 
      className={`${sizeClasses[size]} ${className}`}
      style={{ 
        filter: `${getColorFilter(color)} ${getStyleNormalization(name)}`,
        transition: 'filter 0.2s ease-in-out'
      }}
    />
  );
};

export default CustomIcon;
