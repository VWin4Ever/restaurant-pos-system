import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import Icon from '../common/Icon';
import logo from '../../assets/logo.png'; // Adjust path if needed

const Layout = () => {
  const { user, logout, isAdmin, hasPermission } = useAuth();
  const { getRestaurantName } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      { name: 'Users', href: '/users', icon: 'users' },
      { name: 'Reports', href: '/reports', icon: 'reports' },
      { name: 'Settings', href: '/settings', icon: 'settings' },
    ] : []),
    { name: 'Profile', href: '/profile', icon: 'profile' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-background to-surface">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
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
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto custom-scrollbar">
            <div className="flex-shrink-0 flex items-center px-4">
              <img
                src={logo}
                alt="Angkor Holiday Hotel Logo"
                className="h-10 w-auto mr-3 rounded-lg shadow"
                style={{ background: 'white' }} // Optional: white background for contrast
              />
              <h1 className="text-xl font-bold text-gradient">Angkor Holiday Hotel</h1>
            </div>
            <nav className="mt-8 px-2 space-y-2">
              {navigation.map((item, index) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex items-center px-4 py-3 text-base font-medium rounded-xl transition-all duration-300 hover:transform hover:scale-105 animate-slide-up
                      ${isActive ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white border-l-4 border-primary-600 font-bold shadow-soft' : 'text-text-secondary group-hover:text-primary-600 group-hover:bg-surface'}`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className={`mr-4 ${isActive ? 'icon-primary' : 'icon-container bg-neutral-100 text-neutral-600 group-hover:bg-primary-100 group-hover:text-primary-700'}`}>
                      <Icon name={item.icon} />
                    </div>
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 sidebar">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto custom-scrollbar">
              <div className="flex items-center flex-shrink-0 px-4">
                <img
                  src={logo}
                  alt="Angkor Holiday Hotel Logo"
                  className="h-10 w-auto mr-3 rounded-lg shadow"
                  style={{ background: 'white' }} // Optional: white background for contrast
                />
                <h1 className="text-xl font-bold text-gradient">Angkor Holiday Hotel</h1>
              </div>
              <nav className="mt-8 flex-1 px-2 space-y-2">
                {navigation.map((item, index) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 hover:transform hover:scale-105 animate-slide-up
                        ${isActive ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white border-l-4 border-primary-600 font-bold shadow-soft' : 'text-text-secondary group-hover:text-primary-600 group-hover:bg-surface'}`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className={`mr-3 ${isActive ? 'icon-primary' : 'icon-container bg-neutral-100 text-neutral-600 group-hover:bg-primary-100 group-hover:text-primary-700'}`}>
                        <Icon name={item.icon} />
                      </div>
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-xl bg-white/80 backdrop-blur-sm border border-neutral-200 text-text-secondary hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 transition-all duration-200 hover:shadow-soft"
            onClick={() => setSidebarOpen(true)}
          >
            <Icon name="menu" />
          </button>
        </div>

        {/* Header */}
        <div className="header">
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex items-center">
              <h2 className="text-2xl font-bold text-gradient">
                {getRestaurantName()} — {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
              </h2>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <div className="flex items-center space-x-4">
                {/* User Avatar/Initials */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-600 to-primary-700 text-white flex items-center justify-center font-bold text-lg shadow-soft">
                  {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : <Icon name="user" />}
                </div>
                <div className="text-sm text-text-secondary bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl border border-neutral-200">
                  Welcome, <span className="font-semibold text-primary-600">{user?.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="btn-secondary text-sm"
                >
                  <Icon name="close" size="sm" className="mr-2" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none custom-scrollbar">
          <div className="py-6">
            <div className="container-responsive">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout; 