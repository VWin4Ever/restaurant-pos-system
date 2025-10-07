import React, { Suspense, lazy } from 'react';
import LoadingSpinner from './LoadingSpinner';

// Higher-order component for lazy loading with error boundary
const withLazyLoading = (importFunc, fallback = <LoadingSpinner />) => {
  const LazyComponent = lazy(importFunc);
  
  return (props) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

// Pre-configured lazy components for common use cases
export const LazyChart = withLazyLoading(() => import('recharts').then(module => ({ default: module.ResponsiveContainer })));
export const LazyBarChart = withLazyLoading(() => import('recharts').then(module => ({ default: module.BarChart })));
export const LazyPieChart = withLazyLoading(() => import('recharts').then(module => ({ default: module.PieChart })));
export const LazyLineChart = withLazyLoading(() => import('recharts').then(module => ({ default: module.LineChart })));

// Lazy load heavy components
export const LazyReports = withLazyLoading(() => import('../reports/ReportsOverview'));
export const LazySalesReports = withLazyLoading(() => import('../reports/SalesReports'));
export const LazyStaffReports = withLazyLoading(() => import('../reports/StaffReports'));
export const LazyInventoryReports = withLazyLoading(() => import('../reports/InventoryReports'));
export const LazyFinancialReports = withLazyLoading(() => import('../reports/FinancialReports'));

// Lazy load settings components
export const LazySettings = withLazyLoading(() => import('../settings/Settings'));
export const LazyShiftManagement = withLazyLoading(() => import('../settings/ShiftManagement'));
export const LazyUserShiftAssignment = withLazyLoading(() => import('../settings/UserShiftAssignment'));
export const LazyAdminShiftControl = withLazyLoading(() => import('../settings/AdminShiftControl'));

// Lazy load other heavy components
export const LazyStock = withLazyLoading(() => import('../stock/Stock'));
export const LazyProducts = withLazyLoading(() => import('../products/Products'));
export const LazyCategories = withLazyLoading(() => import('../categories/Categories'));

export default withLazyLoading;


