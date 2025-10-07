import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import Icon from '../common/Icon';
import ClockInOut from '../common/ClockInOut';
import logo from '../../assets/logo.png'; // Adjust path if needed

const Layout = () => {
  const { user, logout, isAdmin, hasPermission } = useAuth();
  const { getRestaurantName, getTimezone } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [reportsSubmenuOpen, setReportsSubmenuOpen] = useState(false);
  const [usersShiftSubmenuOpen, setUsersShiftSubmenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: 'home' },
    { name: 'Orders', href: '/orders', icon: 'orders' },
    { name: 'Tables', href: '/tables', icon: 'tables' },
    ...(hasPermission('products.view') ? [
      { name: 'Products', href: '/products', icon: 'products' },
    ] : []),
    ...(hasPermission('categories.view') ? [
      { name: 'Categories', href: '/categories', icon: 'categories' },
    ] : []),
    ...(isAdmin ? [
      { name: 'Stock', href: '/stock', icon: 'stock' },
      { 
        name: 'Users & Shift', 
        href: '/users', 
        icon: 'users',
        hasSubmenu: true,
        submenu: [
          { name: 'Users', href: '/users', icon: 'users' },
          { name: 'Shift', href: '/shift', icon: 'clock' },
        ]
      },
      { 
        name: 'Reports', 
        href: '/reports', 
        icon: 'reports',
        hasSubmenu: true,
        submenu: [
          { name: 'Sales', href: '/reports/sales', icon: 'sales' },
          { name: 'Staff', href: '/reports/staff', icon: 'users' },
          { name: 'Inventory', href: '/reports/inventory', icon: 'stock' },
          { name: 'Financial', href: '/reports/financial', icon: 'financial' },
        ]
      },
      { name: 'Settings', href: '/settings', icon: 'settings' },
    ] : []),
    // Cashier-specific reports (limited access)
    ...(user?.role === 'CASHIER' ? [
      { 
        name: 'Sales', 
        href: '/reports/sales', 
        icon: 'sales'
      },
    ] : []),
    { name: 'Profile', href: '/profile', icon: 'profile' },
  ];

  // Check if current path is in reports section
  const isInReportsSection = location.pathname.startsWith('/reports');
  const isInUsersShiftSection = location.pathname.startsWith('/users') || location.pathname.startsWith('/shift');
  
  // Handle submenu state based on navigation
  useEffect(() => {
    if (isInReportsSection && !reportsSubmenuOpen) {
      setReportsSubmenuOpen(true);
    } else if (!isInReportsSection && reportsSubmenuOpen) {
      setReportsSubmenuOpen(false);
    }
  }, [location.pathname, isInReportsSection, reportsSubmenuOpen]);

  useEffect(() => {
    if (isInUsersShiftSection && !usersShiftSubmenuOpen) {
      setUsersShiftSubmenuOpen(true);
    } else if (!isInUsersShiftSection && usersShiftSubmenuOpen) {
      setUsersShiftSubmenuOpen(false);
    }
  }, [location.pathname, isInUsersShiftSection, usersShiftSubmenuOpen]);



  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Update date and time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []); // Empty dependency array is correct here

  // Format date and time according to business timezone
  const formatDateTime = () => {
    const timezone = getTimezone();
    try {
      return currentDateTime.toLocaleString('en-US', {
        timeZone: timezone,
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      // Fallback to local time if timezone is invalid
      return currentDateTime.toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }
  };

  const renderNavigationItem = (item, index, isMobile = false) => {
    const isActive = location.pathname === item.href;
    const isReportsItem = item.name === 'Reports';
    const isUsersShiftItem = item.name === 'Users & Shift';
    const isSubmenuItem = item.hasSubmenu && item.submenu;

    if (isSubmenuItem) {
      return (
        <div key={item.name} className="space-y-1">
          <button
            onClick={() => {
              if (isReportsItem) {
                setReportsSubmenuOpen(!reportsSubmenuOpen);
              } else if (isUsersShiftItem) {
                setUsersShiftSubmenuOpen(!usersShiftSubmenuOpen);
              }
            }}
            className={`group flex items-center w-full px-4 py-3 text-lg font-bold rounded-xl transition-all duration-300 hover:transform hover:scale-105 animate-slide-up
              ${(isInReportsSection && isReportsItem) || (isInUsersShiftSection && isUsersShiftItem) ? 'bg-white text-primary-700 border-l-4 border-primary-600 font-bold shadow-soft' : 'text-gray-200 group-hover:text-white group-hover:bg-white/10'}`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className={`mr-4 ${(isInReportsSection && isReportsItem) || (isInUsersShiftSection && isUsersShiftItem) ? 'icon-container bg-primary-100 text-primary-700' : 'icon-container bg-white/20 text-gray-200 group-hover:bg-white/30 group-hover:text-white'}`}>
              <Icon name={item.icon} color={(isInReportsSection && isReportsItem) || (isInUsersShiftSection && isUsersShiftItem) ? '#1f2937' : '#e5e7eb'} />
            </div>
            <span className="flex-1 text-left">{item.name}</span>
            <div className={`transform transition-transform duration-200 ${(isReportsItem && reportsSubmenuOpen) || (isUsersShiftItem && usersShiftSubmenuOpen) ? 'rotate-180' : ''}`}>
              <Icon name="chevron-down" className="w-4 h-4" />
            </div>
          </button>
          
          {((isReportsItem && reportsSubmenuOpen) || (isUsersShiftItem && usersShiftSubmenuOpen)) && (
            <div className="ml-4 space-y-2">
              {item.submenu.map((subItem, subIndex) => {
                const isSubActive = location.pathname === subItem.href;
                const getGradientClass = (subItem) => {
                  switch (subItem.name) {
                    case 'Overview': return 'from-blue-500 to-blue-600';
                    case 'Sales': return 'from-green-500 to-green-600';
                    case 'Staff': return 'from-purple-500 to-purple-600';
                    case 'Inventory': return 'from-orange-500 to-orange-600';
                    case 'Financial': return 'from-red-500 to-red-600';
                    default: return 'from-gray-500 to-gray-600';
                  }
                };
                return (
                  <Link
                    key={subItem.name}
                    to={subItem.href}
                    onClick={() => {
                      if (isMobile) {
                        setSidebarOpen(false);
                      }
                      // Keep submenu open when clicking on submenu items
                    }}
                    className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 hover:transform hover:scale-105 shadow-md
                      ${isSubActive 
                        ? `bg-gradient-to-r ${getGradientClass(subItem)} text-white shadow-lg` 
                        : 'bg-white/10 text-gray-300 group-hover:bg-white/20 group-hover:text-white hover:shadow-lg'
                      }`}
                    style={{ animationDelay: `${(index * 50) + (subIndex * 25)}ms` }}
                  >
                    <div className={`mr-3 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                      isSubActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-white/10 text-gray-300 group-hover:bg-white/20 group-hover:text-white'
                    }`}>
                      <Icon name={subItem.icon} color={isSubActive ? '#ffffff' : '#d1d5db'} />
                    </div>
                    <span className="font-semibold">{subItem.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.name}
        to={item.href}
        onClick={() => isMobile && setSidebarOpen(false)}
        className={`group flex items-center px-4 py-3 text-lg font-bold rounded-xl transition-all duration-300 hover:transform hover:scale-105 animate-slide-up
          ${isActive ? 'bg-white text-primary-700 border-l-4 border-primary-600 font-bold shadow-soft' : 'text-gray-200 group-hover:text-white group-hover:bg-white/10'}`}
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <div className={`mr-4 ${isActive ? 'icon-container bg-primary-100 text-primary-700' : 'icon-container bg-white/20 text-gray-200 group-hover:bg-white/30 group-hover:text-white'}`}>
          <Icon name={item.icon} color={isActive ? '#1f2937' : '#e5e7eb'} />
        </div>
        <span>{item.name}</span>
      </Link>
    );
  };

  const renderDesktopNavigationItem = (item, index) => {
    const isActive = location.pathname === item.href;
    const isReportsItem = item.name === 'Reports';
    const isUsersShiftItem = item.name === 'Users & Shift';
    const isSubmenuItem = item.hasSubmenu && item.submenu;

    if (isSubmenuItem) {
      return (
        <div key={item.name} className="space-y-1">
          <button
            onClick={() => {
              if (sidebarCollapsed) {
                // When collapsed, navigate directly to the main section
                if (isReportsItem) {
                  navigate('/reports');
                } else if (isUsersShiftItem) {
                  navigate('/users');
                }
              } else {
                // When expanded, navigate to main section first, then toggle submenu
                if (isReportsItem) {
                  navigate('/reports');
                  setReportsSubmenuOpen(!reportsSubmenuOpen);
                } else if (isUsersShiftItem) {
                  navigate('/users');
                  setUsersShiftSubmenuOpen(!usersShiftSubmenuOpen);
                }
              }
            }}
            className={`group flex items-center w-full ${sidebarCollapsed ? 'justify-center px-2 py-4 cursor-pointer' : 'px-4 py-3'} text-base font-bold rounded-xl transition-all duration-300 hover:transform hover:scale-105 animate-slide-up
              ${(isInReportsSection && isReportsItem) || (isInUsersShiftSection && isUsersShiftItem) ? 'bg-white text-primary-700 border-l-4 border-primary-600 font-bold shadow-soft' : 'text-gray-200 group-hover:text-white group-hover:bg-white/10'}`}
            style={{ animationDelay: `${index * 50}ms` }}
            title={sidebarCollapsed ? `${item.name} - Click to go to ${isReportsItem ? 'Reports' : 'Users'} Overview` : `${item.name} - Click to go to ${isReportsItem ? 'Reports' : 'Users'} Overview, or use submenu for specific ${isReportsItem ? 'reports' : 'sections'}`}
          >
            <div className={`${sidebarCollapsed ? 'mr-0 w-10 h-10 reports-clickable' : 'mr-3 w-8 h-8'} flex items-center justify-center rounded-lg transition-all duration-200 ${(isInReportsSection && isReportsItem) || (isInUsersShiftSection && isUsersShiftItem) ? 'icon-container bg-primary-100 text-primary-700' : 'icon-container bg-white/20 text-gray-200 group-hover:bg-white/30 group-hover:text-white'}`}>
              <Icon name={item.icon} size={sidebarCollapsed ? 'lg' : 'md'} color={(isInReportsSection && isReportsItem) || (isInUsersShiftSection && isUsersShiftItem) ? '#1f2937' : '#e5e7eb'} />
            </div>
            {!sidebarCollapsed && (
              <>
                <span className="flex-1 text-left">{item.name}</span>
                <div className={`transform transition-transform duration-200 ${(isReportsItem && reportsSubmenuOpen) || (isUsersShiftItem && usersShiftSubmenuOpen) ? 'rotate-180' : ''}`}>
                  <Icon name="chevron-down" className="w-4 h-4" color={(isInReportsSection && isReportsItem) || (isInUsersShiftSection && isUsersShiftItem) ? '#1f2937' : '#e5e7eb'} />
                </div>
              </>
            )}
          </button>
          
          {((isReportsItem && reportsSubmenuOpen) || (isUsersShiftItem && usersShiftSubmenuOpen)) && !sidebarCollapsed && (
            <div className="ml-4 space-y-2">
              {item.submenu.map((subItem, subIndex) => {
                const isSubActive = location.pathname === subItem.href;
                return (
                  <Link
                    key={subItem.name}
                    to={subItem.href}
                    onClick={() => {
                      // Keep submenu open when clicking on submenu items
                    }}
                    className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 hover:transform hover:scale-105 shadow-md
                      ${isSubActive 
                        ? 'bg-white text-primary-700 border-l-4 border-primary-600 font-bold shadow-soft' 
                        : 'bg-white/10 text-gray-300 group-hover:bg-white/20 group-hover:text-white hover:shadow-lg'
                      }`}
                    style={{ animationDelay: `${(index * 50) + (subIndex * 25)}ms` }}
                  >
                    <div className={`mr-3 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                      isSubActive 
                        ? 'icon-container bg-primary-100 text-primary-700' 
                        : 'bg-white/10 text-gray-300 group-hover:bg-white/20 group-hover:text-white'
                    }`}>
                      <Icon name={subItem.icon} color={isSubActive ? '#1f2937' : '#d1d5db'} />
                    </div>
                    <span className="font-semibold">{subItem.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.name}
        to={item.href}
        className={`group flex items-center ${sidebarCollapsed ? 'justify-center px-2 py-4' : 'px-4 py-3'} text-base font-bold rounded-xl transition-all duration-300 hover:transform hover:scale-105 animate-slide-up
          ${isActive ? 'bg-white text-primary-700 border-l-4 border-primary-600 font-bold shadow-soft' : 'text-gray-200 group-hover:text-white group-hover:bg-white/10'}`}
        style={{ animationDelay: `${index * 50}ms` }}
        title={sidebarCollapsed ? item.name : undefined}
      >
        <div className={`${sidebarCollapsed ? 'mr-0 w-10 h-10' : 'mr-3 w-8 h-8'} flex items-center justify-center rounded-lg transition-all duration-200 ${isActive ? 'icon-container bg-primary-100 text-primary-700' : 'icon-container bg-white/20 text-gray-200 group-hover:bg-white/30 group-hover:text-white'}`}>
          <Icon name={item.icon} size={sidebarCollapsed ? 'lg' : 'md'} color={isActive ? '#1f2937' : '#e5e7eb'} />
        </div>
        {!sidebarCollapsed && <span>{item.name}</span>}
      </Link>
    );
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-200">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
        <div className="relative flex-1 flex flex-col max-w-xs w-full sidebar">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-all duration-200 hover:bg-white/30"
              onClick={() => setSidebarOpen(false)}
            >
              <Icon name="close" className="text-white" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-2 pb-4 overflow-y-auto custom-scrollbar">
            <div className="flex-shrink-0 flex flex-col items-center px-4">
              <img
                src={logo}
                alt={`${getRestaurantName()} Logo`}
                className="h-16 w-auto mb-1 rounded-xl shadow-soft"
                style={{ background: 'white' }}
              />
              <h1 className="text-lg font-bold text-center">
                <span className="text-white">{getRestaurantName()}</span>
              </h1>
            </div>
            <nav className="px-2 space-y-2">
              {navigation.map((item, index) => renderNavigationItem(item, index, true))}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={`hidden lg:flex lg:flex-shrink-0 transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="flex flex-col w-full">
          <div className={`flex flex-col h-0 flex-1 sidebar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            <div className="flex-1 flex flex-col pt-4 pb-4 overflow-y-auto custom-scrollbar">
              <div className="flex flex-col items-center flex-shrink-0 px-3">
                <img
                  src={logo}
                  alt={`${getRestaurantName()} Logo`}
                  className={`${sidebarCollapsed ? 'h-10 w-10' : 'h-16'} w-auto mb-2 rounded-xl shadow-soft transition-all duration-300`}
                  style={{ background: 'white' }}
                />
                {!sidebarCollapsed && (
                  <h1 className="text-lg font-bold text-center mb-2">
                    <span className="text-white">{getRestaurantName()}</span>
                  </h1>
                )}
              </div>
              <nav className="flex-1 px-3 space-y-3">
                {navigation.map((item, index) => renderDesktopNavigationItem(item, index))}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="lg:hidden pl-1 pt-1 sm:pl-3 sm:pt-3">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-xl bg-white/80 backdrop-blur-sm border border-neutral-200 text-text-secondary hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 transition-all duration-200 hover:shadow-soft"
            onClick={() => setSidebarOpen(true)}
          >
            <Icon name="menu" color="#6b7280" />
          </button>
        </div>

        {/* Header */}
        <div className="header">
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex items-center">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:flex items-center justify-center h-8 w-8 rounded-lg bg-white/80 backdrop-blur-sm border border-neutral-200 text-text-secondary hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 transition-all duration-200 hover:shadow-soft mr-4"
              >
                <Icon name={sidebarCollapsed ? "menu" : "close"} />
              </button>
              <div className="flex items-center space-x-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gradient">
                  {getRestaurantName()} — {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
                </h2>
                <div className="text-sm text-text-secondary bg-white/60 backdrop-blur-sm px-3 py-1 rounded-lg border border-neutral-200 text-center font-mono">
                  {formatDateTime()}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Clock In/Out Component */}
              <div className="hidden lg:block">
                <ClockInOut />
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-700">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-medium text-text-primary">{user?.name}</div>
                  <div className="text-xs text-text-secondary">{user?.role}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-white/60 backdrop-blur-sm rounded-lg border border-transparent hover:border-neutral-200 transition-all duration-200"
              >
                <Icon name="logout" color="#6b7280" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout; 