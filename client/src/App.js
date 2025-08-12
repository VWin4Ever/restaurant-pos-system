import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import { API_BASE_URL } from './config';
import websocketService from './services/websocket';

// Components
import Login from './components/auth/Login';
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';
import Orders from './components/orders/Orders';
import Tables from './components/tables/Tables';
import Products from './components/products/Products';
import Categories from './components/categories/Categories';
import Stock from './components/stock/Stock';
import Users from './components/users/Users';

import ReportsOverview from './components/reports/ReportsOverview';
import SalesReports from './components/reports/SalesReports';
import StaffReports from './components/reports/StaffReports';
import InventoryReports from './components/reports/InventoryReports';
import FinancialReports from './components/reports/FinancialReports';
import Profile from './components/profile/Profile';
import Settings from './components/settings/Settings';
import LoadingSpinner from './components/common/LoadingSpinner';

// Set up axios base URL
axios.defaults.baseURL = API_BASE_URL;

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  const { loading, isAuthenticated, hasPermission } = useAuth();

  // Initialize WebSocket connection when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Connect to WebSocket with a small delay to ensure server is ready
      const connectWebSocket = () => {
        setTimeout(() => {
          websocketService.connect();
        }, 1000);
      };
      
      connectWebSocket();
      
      // Cleanup on unmount
      return () => {
        websocketService.disconnect();
      };
    }
  }, [isAuthenticated]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <SettingsProvider>
      <div className="App">
        <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
          } 
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="tables" element={<Tables />} />
          {/* Products route: permission-based */}
          <Route
            path="products"
            element={
              hasPermission('products.view') ? <Products /> : <Navigate to="/dashboard" replace />
            }
          />
          {/* Categories route: permission-based */}
          <Route
            path="categories"
            element={
              hasPermission('categories.view') ? <Categories /> : <Navigate to="/dashboard" replace />
            }
          />
          {/* Admin Only Routes */}
          <Route
            path="stock"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Stock />
              </ProtectedRoute>
            }
          />
          <Route
            path="users"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Users />
              </ProtectedRoute>
            }
          />
          {/* Reports Routes */}
          <Route
            path="reports"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <ReportsOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports/sales"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <SalesReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports/staff"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <StaffReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports/inventory"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <InventoryReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports/financial"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <FinancialReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      {/* Toast Notifications */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      </div>
    </SettingsProvider>
  );
}

export default App; 