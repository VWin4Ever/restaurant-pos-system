import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import LoadingSpinner from '../common/LoadingSpinner';
import Icon from '../common/Icon';
import IconTest from '../common/IconTest';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [hourlySales, setHourlySales] = useState([]);
  const [categorySales, setCategorySales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const COLORS = ['#6B2C2F', '#E74C3C', '#F39C12', '#27AE60', '#3498DB', '#9B59B6'];

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch dashboard data with individual error handling
      const fetchData = async (url, fallback = []) => {
        try {
          const response = await axios.get(url);
          return response.data.data;
        } catch (err) {
          console.warn(`Failed to fetch ${url}:`, err.message);
          return fallback;
        }
      };

      // Role-based dashboard data fetching
      const isCashier = user?.role === 'CASHIER';
      
      // Fetch all dashboard data - TODAY's data with 7-day trend for context
      const [
        statsData,
        monthlySalesData,
        salesData,
        topProductsData,
        lowStockData,
        hourlySalesData,
        categorySalesData
      ] = await Promise.all([
        // Use cashier-specific dashboard for cashiers, general dashboard for admins
        fetchData(isCashier ? '/api/reports/cashier-dashboard' : `/api/reports/dashboard?range=today`, {}),
        fetchData(`/api/reports/dashboard?range=month`, {}), // Full month sales
        fetchData(isCashier ? '/api/reports/cashier-sales?range=week' : `/api/reports/sales?range=week`, []), // Last 7 days for trend
        // Use cashier-specific endpoints for cashiers
        fetchData(isCashier ? '/api/reports/cashier-top-products?range=today&limit=5' : '/api/reports/top-products?range=today&limit=5', []),
        fetchData('/api/reports/inventory/low-stock-alert', []),
        fetchData('/api/reports/sales/peak-hours?range=today', []),
        fetchData('/api/reports/sales/category-sales?range=today', [])
      ]);

      // Set data
      setStats(statsData || {});
      setMonthlyStats(monthlySalesData || {});
      setSalesData(salesData || []);
      setTopProducts(topProductsData || []);
      setLowStockAlerts(lowStockData || []);
      
      // Fix data structure for hourly sales
      if (hourlySalesData && hourlySalesData.hourlySales) {
        setHourlySales(hourlySalesData.hourlySales);
      } else {
        setHourlySales([]);
      }
      
      // Fix data structure for category sales
      if (categorySalesData && categorySalesData.categorySales) {
        setCategorySales(categorySalesData.categorySales);
      } else {
        setCategorySales([]);
      }

    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial fetch and auto-refresh every 2 minutes (reduced frequency)
  useEffect(() => {
    fetchDashboard();
    
    // Auto-refresh for real-time dashboard (reduced from 30s to 2 minutes)
    const interval = setInterval(() => {
      fetchDashboard();
    }, 120000); // 2 minutes instead of 30 seconds
    
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  if (loading) return <LoadingSpinner />;
  if (error) return (
    <div className="flex flex-col items-center justify-center py-16">
      <Icon name="error" className="w-16 h-16 text-error mb-4" />
      <div className="text-xl font-bold text-error mb-2">{error}</div>
      <button className="btn-primary" onClick={() => window.location.reload()}>Retry</button>
    </div>
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Dashboard Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Restaurant Dashboard</h1>
          <p className="text-gray-600 mt-1">
            {user?.role === 'CASHIER' 
              ? `Welcome back, ${user?.name}! Here's your performance today.`
              : 'Real-time overview of restaurant operations'
            }
          </p>
        </div>
        <button
          onClick={() => navigate('/orders', { state: { openCreateModal: true } })}
          className="btn-primary flex items-center gap-2 hover:scale-105 transition-transform"
        >
          <Icon name="add" className="w-5 h-5" />
          <span>Create New Order</span>
        </button>
      </div>

      {/* Key Metrics Grid - Today's Performance */}
      {/* Custom Icons Test - Temporary */}
      <IconTest />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard 
          title="Today's Sales" 
          value={formatCurrency(stats?.todaySales?.total || stats?.mySalesToday || 0)} 
          icon="money" 
          color="primary" 
          subtitle={user?.role === 'CASHIER' 
            ? `${stats?.myOrdersToday || 0} orders completed` 
            : `${stats?.todaySales?.count || 0} completed orders`
          }
        />
        <StatCard 
          title="Monthly Sales" 
          value={user?.role === 'CASHIER' 
            ? (stats?.myOrdersToday || 0) 
            : formatCurrency(monthlyStats?.todaySales?.total || 0)
          } 
          icon={user?.role === 'CASHIER' ? "orders" : "reports"} 
          color="accent" 
          subtitle={user?.role === 'CASHIER' 
            ? "Orders I've processed" 
            : `${monthlyStats?.todaySales?.count || 0} orders this month`
          }
        />
        <StatCard 
          title="Pending Orders" 
          value={stats?.pendingOrders || 0} 
          icon="clock" 
          color="warning" 
          onClick={() => navigate('/orders')} 
          clickable 
          subtitle="Awaiting payment"
        />
        <StatCard 
          title="Available Tables" 
          value={stats?.availableTables || 0} 
          icon="tables" 
          color="success" 
          onClick={() => navigate('/tables')} 
          clickable 
          subtitle="Ready for service"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart - Last 7 Days for Context */}
        <div className="bg-surface rounded-2xl p-4 sm:p-6 shadow-soft">
          <h2 className="text-lg sm:text-xl font-bold mb-4">Recent Sales Trend (7 Days)</h2>
          {salesData && salesData.length > 0 ? (
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Line type="monotone" dataKey="total" stroke="#6B2C2F" strokeWidth={3} dot={{ fill: '#6B2C2F' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400 text-lg">No sales data available.</div>
          )}
        </div>

        {/* Category Sales Chart - Today's Distribution */}
        <div className="bg-surface rounded-2xl p-4 sm:p-6 shadow-soft">
          <h2 className="text-lg sm:text-xl font-bold mb-4">Today's Sales by Category</h2>
          {categorySales && categorySales.length > 0 ? (
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categorySales}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="revenue"
                  >
                    {categorySales?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400 text-lg">No category data available for today.</div>
          )}
        </div>
      </div>

      {/* Peak Hours Chart - Today's Hourly Performance */}
      <div className="bg-surface rounded-2xl p-4 sm:p-6 shadow-soft">
        <h2 className="text-lg sm:text-xl font-bold mb-4">Today's Peak Hours</h2>
        {hourlySales && hourlySales.length > 0 ? (
          <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlySales} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="revenue" fill="#6B2C2F" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-40 text-gray-400 text-lg">No hourly data available for today.</div>
        )}
      </div>

      {/* Top Products and Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products - Today's Best Sellers */}
        <div className="bg-surface rounded-2xl p-4 sm:p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Today's Top Products</h3>
            <button 
              className="text-primary text-sm hover:underline flex items-center gap-1"
              onClick={() => navigate('/reports')}
            >
              <span>View All</span>
              <Icon name="chevronRight" className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {topProducts && topProducts.length > 0 ? (
              topProducts.slice(0, 5).map((product, index) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-background rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-orange-600' : 
                      'bg-primary'
                    } text-white text-xs flex items-center justify-center font-bold`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{product.name}</div>
                      <div className="text-xs text-gray-500">{product.category}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">{product.quantity} sold</div>
                    <div className="text-xs text-gray-500">{formatCurrency(product.revenue)}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 py-8">
                <Icon name="products" className="w-8 h-8 mx-auto mb-2" />
                <div className="text-sm">No sales today yet</div>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-surface rounded-2xl p-4 sm:p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Low Stock Alerts</h3>
            {lowStockAlerts && lowStockAlerts.length > 0 && (
              <button 
                className="text-warning text-sm hover:underline flex items-center gap-1"
                onClick={() => navigate('/stock')}
              >
                <span>Manage Stock</span>
                <Icon name="chevronRight" className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="space-y-3">
            {lowStockAlerts && lowStockAlerts.length > 0 ? (
              lowStockAlerts.slice(0, 5).map((alert) => (
                <div 
                  key={alert.id} 
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer hover:scale-[1.02] transition-all ${
                    alert.alertLevel === 'Critical' 
                      ? 'bg-error/10 border border-error/30' 
                      : 'bg-warning/10 border border-warning/20'
                  }`}
                  onClick={() => navigate('/stock')}
                >
                  <div className="flex items-center space-x-3">
                    <Icon 
                      name={alert.alertLevel === 'Critical' ? 'error' : 'warning'} 
                      className={alert.alertLevel === 'Critical' ? 'text-error' : 'text-warning'} 
                    />
                    <div>
                      <div className="font-medium text-sm">{alert.productName}</div>
                      <div className="text-xs text-gray-500">
                        Current: {alert.currentStock} • Min: {alert.minStock}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-bold ${alert.alertLevel === 'Critical' ? 'text-error' : 'text-warning'}`}>
                      {alert.alertLevel}
                    </div>
                    <div className="text-xs text-gray-500">
                      Need: {alert.deficit}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 py-8">
                <Icon name="check" className="w-8 h-8 mx-auto mb-2 text-success" />
                <div className="text-sm">All stock levels are good!</div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

function formatCurrency(amount) {
  if (typeof amount !== 'number') amount = Number(amount) || 0;
  return '$' + amount.toLocaleString(undefined, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
}

const StatCard = ({ title, value, icon, color, subtitle, onClick, clickable }) => {
  const getGradientClass = (color) => {
    switch (color) {
      case 'primary': return 'from-green-500 to-green-600';
      case 'success': return 'from-green-500 to-green-600';
      case 'warning': return 'from-orange-500 to-orange-600';
      case 'accent': return 'from-purple-500 to-purple-600';
      case 'error': return 'from-red-500 to-red-600';
      default: return 'from-blue-500 to-blue-600';
    }
  };

  const getIconName = (icon) => {
    switch (icon) {
      case 'money': return 'money';
      case 'clock': return 'clock';
      case 'tables': return 'tables';
      case 'reports': return 'reports';
      default: return 'trending-up';
    }
  };

  return (
    <div
      className={`bg-gradient-to-r ${getGradientClass(color)} p-6 rounded-xl shadow-lg text-white cursor-${clickable ? 'pointer' : 'default'} transition hover:shadow-xl hover:-translate-y-1`}
      onClick={clickable ? onClick : undefined}
      tabIndex={clickable ? 0 : -1}
      role={clickable ? 'button' : undefined}
      aria-label={clickable ? title : undefined}
      style={clickable ? { outline: 'none' } : {}}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-90">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          {subtitle && <p className="text-xs opacity-75 mt-1">{subtitle}</p>}
        </div>
        <div className="text-4xl">
          <Icon name={getIconName(icon)} size="2xl" color="white" />
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 