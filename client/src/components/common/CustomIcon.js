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

  // Your custom icons mapping - replace these with your own icon paths
  const customIcons = {
    // Navigation icons
    home: '/icons/home.svg',
    orders: '/icons/orders.svg',
    tables: '/icons/tables.svg',
    table: '/icons/table.svg',
    products: '/icons/products.svg',
    categories: '/icons/categories.svg',
    category: '/icons/category.svg',
    stock: '/icons/stock.svg',
    users: '/icons/users.svg',
    user: '/icons/user.svg',
    reports: '/icons/reports.svg',
    settings: '/icons/settings.svg',
    profile: '/icons/profile.svg',
    
    // Action icons
    add: '/icons/add.svg',
    plus: '/icons/plus.svg',
    minus: '/icons/minus.svg',
    edit: '/icons/edit.svg',
    delete: '/icons/delete.svg',
    trash: '/icons/trash.svg',
    search: '/icons/search.svg',
    filter: '/icons/filter.svg',
    close: '/icons/close.svg',
    menu: '/icons/menu.svg',
    
    // Status icons
    check: '/icons/check.svg',
    warning: '/icons/warning.svg',
    error: '/icons/error.svg',
    alert: '/icons/alert.svg',
    info: '/icons/info.svg',
    star: '/icons/star.svg',
    
    // Finance icons
    money: '/icons/money.svg',
    currency: '/icons/currency.svg',
    creditCard: '/icons/credit-card.svg',
    payment: '/icons/payment.svg',
    
    // Time icons
    clock: '/icons/clock.svg',
    calendar: '/icons/calendar.svg',
    
    // Arrow icons
    chevronRight: '/icons/chevron-right.svg',
    chevronLeft: '/icons/chevron-left.svg',
    chevronDown: '/icons/chevron-down.svg',
    chevronUp: '/icons/chevron-up.svg',
    
    // Other icons
    download: '/icons/download.svg',
    upload: '/icons/upload.svg',
    refresh: '/icons/refresh.svg',
    eye: '/icons/eye.svg',
    eyeOff: '/icons/eye-off.svg',
    
    // Food and restaurant icons
    food: '/icons/food.svg',
    restaurant: '/icons/restaurant.svg',
    
    // Receipt and order icons
    receipt: '/icons/receipt.svg',
    cart: '/icons/cart.svg',
    
    // Note and document icons
    note: '/icons/note.svg',
    document: '/icons/document.svg',
    
    // Grid and list icons
    grid: '/icons/grid.svg',
    list: '/icons/list.svg',
    
    // Location and contact icons
    location: '/icons/location.svg',
    phone: '/icons/phone.svg',
    email: '/icons/email.svg',
    mail: '/icons/mail.svg',
    link: '/icons/link.svg',
    box: '/icons/box.svg',
    clipboard: '/icons/clipboard.svg',
    
    // Status and quantity icons
    status: '/icons/status.svg',
    quantity: '/icons/quantity.svg',
    
    // Calculator and total icons
    calculator: '/icons/calculator.svg',
    total: '/icons/total.svg',
    
    // Tax and discount icons
    tax: '/icons/tax.svg',
    discount: '/icons/discount.svg',
    
    // Print and heart icons
    print: '/icons/print.svg',
    heart: '/icons/heart.svg',
    
    // Navigation and UI icons
    'chevron-down': '/icons/chevron-down.svg',
    'chevron-up': '/icons/chevron-up.svg',
    'chevron-left': '/icons/chevron-left.svg',
    'chevron-right': '/icons/chevron-right.svg',
    logout: '/icons/logout.svg',
    
    // Report and business icons
    dashboard: '/icons/dashboard.svg',
    sales: '/icons/sales.svg',
    financial: '/icons/financial.svg',
    shield: '/icons/shield.svg',
    
    // Business and settings icons
    business: '/icons/business.svg',
    security: '/icons/security.svg',
    backup: '/icons/backup.svg',
    reset: '/icons/reset.svg',
    
    // Additional icons
    lock: '/icons/lock.svg',
    key: '/icons/key.svg',
    activity: '/icons/activity.svg',
    'check-circle': '/icons/check-circle.svg',
    'x-circle': '/icons/x-circle.svg',
    'alert-circle': '/icons/alert-circle.svg',
    'shield-check': '/icons/shield-check.svg',
    login: '/icons/login.svg',
    save: '/icons/save.svg',
    at: '/icons/at.svg',
  };

  const iconPath = customIcons[name];
  
  if (!iconPath) {
    console.warn(`Custom icon "${name}" not found. Please add it to the customIcons object.`);
    return null;
  }

  return (
    <img 
      src={iconPath} 
      alt={alt || name} 
      className={`${sizeClasses[size]} ${className}`}
      style={{ color }}
    />
  );
};

export default CustomIcon;



