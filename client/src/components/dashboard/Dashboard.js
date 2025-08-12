import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import LoadingSpinner from '../common/LoadingSpinner';
import Icon from '../common/Icon';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [hourlySales, setHourlySales] = useState([]);
  const [categorySales, setCategorySales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('today');
  const navigate = useNavigate();

  const COLORS = ['#6B2C2F', '#E74C3C', '#F39C12', '#27AE60', '#3498DB', '#9B59B6'];

  useEffect(() => {
    const fetchDashboard = async () => {
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

        // Fetch all dashboard data with individual error handling
        const [
          statsData,
          salesData,
          topProductsData,
          lowStockData,
          hourlySalesData,
          categorySalesData
        ] = await Promise.allSettled([
          fetchData(`/api/reports/dashboard?range=${timeRange}`, {}),
          fetchData(`/api/reports/sales?range=${timeRange}`, []),
          fetchData('/api/reports/top-products?limit=5', []),
          fetchData('/api/reports/inventory/low-stock-alert', []),
          fetchData('/api/reports/sales/peak-hours', []),
          fetchData('/api/reports/sales/category-sales', [])
        ]);

        // Set data with fallbacks
        setStats(statsData.status === 'fulfilled' ? statsData.value : {});
        setSalesData(salesData.status === 'fulfilled' ? salesData.value : []);
        setTopProducts(topProductsData.status === 'fulfilled' ? topProductsData.value : []);
        setLowStockAlerts(lowStockData.status === 'fulfilled' ? lowStockData.value : []);
        setHourlySales(hourlySalesData.status === 'fulfilled' ? hourlySalesData.value : []);
        setCategorySales(categorySalesData.status === 'fulfilled' ? categorySalesData.value : []);

        // Check if any critical data failed
        const failedRequests = [
          statsData.status === 'rejected',
          salesData.status === 'rejected',
          topProductsData.status === 'rejected',
          lowStockData.status === 'rejected',
          hourlySalesData.status === 'rejected',
          categorySalesData.status === 'rejected'
        ].filter(Boolean);

        if (failedRequests.length > 0) {
          console.warn(`${failedRequests.length} dashboard requests failed`);
        }

      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError('Failed to load dashboard data');
        toast.error('Some dashboard data could not be loaded');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [timeRange]);

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
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Dashboard</h1>
        <select 
          value={timeRange} 
          onChange={(e) => setTimeRange(e.target.value)}
          className="select-primary"
        >
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="week">This Week</option>
          <option value="lastWeek">Last Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard 
          title="Total Sales" 
          value={formatCurrency(stats?.todaySales?.total || 0)} 
          icon="money" 
          color="primary" 
          subtitle={`${stats?.todaySales?.count || 0} orders`}
        />
        <StatCard 
          title="Pending Orders" 
          value={stats?.pendingOrders || 0} 
          icon="clock" 
          color="warning" 
          onClick={() => navigate('/orders')} 
          clickable 
          subtitle="Need attention"
        />
        <StatCard 
          title="Available Tables" 
          value={stats?.availableTables || 0} 
          icon="tables" 
          color="success" 
          onClick={() => navigate('/tables')} 
          clickable 
          subtitle="Ready for customers"
        />
        <StatCard 
          title="Average Order" 
          value={formatCurrency(stats?.averageOrder || 0)} 
          icon="reports" 
          color="accent" 
          subtitle="Per transaction"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <div className="bg-surface rounded-2xl p-4 sm:p-6 shadow-soft">
          <h2 className="text-lg sm:text-xl font-bold mb-4">Sales Trend</h2>
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

        {/* Category Sales Chart */}
        <div className="bg-surface rounded-2xl p-4 sm:p-6 shadow-soft">
          <h2 className="text-lg sm:text-xl font-bold mb-4">Sales by Category</h2>
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
                    dataKey="total"
                  >
                    {categorySales.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400 text-lg">No category data available.</div>
          )}
        </div>
      </div>

      {/* Peak Hours Chart */}
      <div className="bg-surface rounded-2xl p-4 sm:p-6 shadow-soft">
        <h2 className="text-lg sm:text-xl font-bold mb-4">Peak Hours</h2>
        {hourlySales && hourlySales.length > 0 ? (
          <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlySales} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="total" fill="#6B2C2F" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-40 text-gray-400 text-lg">No hourly data available.</div>
        )}
      </div>

      {/* Quick Actions and Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-surface rounded-2xl p-4 sm:p-6 shadow-soft">
          <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              className="btn-primary w-full flex items-center justify-center transition-transform hover:scale-105" 
              onClick={() => navigate('/orders')}
            >
              <Icon name="add" className="mr-2" /> New Order
            </button>
            <button 
              className="btn-accent w-full flex items-center justify-center transition-transform hover:scale-105" 
              onClick={() => navigate('/tables')}
            >
              <Icon name="tables" className="mr-2" /> Manage Tables
            </button>
            <button 
              className="btn-secondary w-full flex items-center justify-center transition-transform hover:scale-105" 
              onClick={() => navigate('/products')}
            >
              <Icon name="products" className="mr-2" /> View Products
            </button>
            <button 
              className="btn-outline w-full flex items-center justify-center transition-transform hover:scale-105" 
              onClick={() => navigate('/reports')}
            >
              <Icon name="reports" className="mr-2" /> View Reports
            </button>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-surface rounded-2xl p-4 sm:p-6 shadow-soft">
          <h3 className="text-lg font-bold mb-4">Top Products</h3>
          <div className="space-y-3">
            {topProducts && topProducts.length > 0 ? (
              topProducts.slice(0, 5).map((product, index) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-background rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">
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
                <div className="text-sm">No product data available</div>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-surface rounded-2xl p-4 sm:p-6 shadow-soft">
          <h3 className="text-lg font-bold mb-4">Low Stock Alerts</h3>
          <div className="space-y-3">
            {lowStockAlerts && lowStockAlerts.length > 0 ? (
              lowStockAlerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-warning/10 border border-warning/20 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <Icon name="warning" className="text-warning" />
                    <div>
                      <div className="font-medium text-sm">{alert.productName}</div>
                      <div className="text-xs text-gray-500">Current: {alert.currentStock}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-warning font-bold">Low Stock</div>
                    <div className="text-xs text-gray-500">Min: {alert.minStock}</div>
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

      {/* Recent Activity */}
      <div className="bg-surface rounded-2xl p-4 sm:p-6 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Recent Activity</h3>
          <button 
            className="text-primary text-sm hover:underline"
            onClick={() => navigate('/reports')}
          >
            View All
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ActivityCard 
            title="Orders Today"
            value={stats?.todaySales?.count || 0}
            icon="orders"
            color="primary"
            trend="+12%"
          />
          <ActivityCard 
            title="Average Wait Time"
            value="8 min"
            icon="clock"
            color="warning"
            trend="-5%"
          />
          <ActivityCard 
            title="Customer Satisfaction"
            value="4.8/5"
            icon="star"
            color="success"
            trend="+2%"
          />
        </div>
      </div>
    </div>
  );
};

function formatCurrency(amount) {
  if (typeof amount !== 'number') amount = Number(amount) || 0;
  return '$' + amount.toLocaleString();
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

  const getEmoji = (icon) => {
    switch (icon) {
      case 'money': return '💰';
      case 'clock': return '⏳';
      case 'tables': return '🪑';
      case 'reports': return '📊';
      default: return '📈';
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
        <div className="text-4xl">{getEmoji(icon)}</div>
      </div>
    </div>
  );
};

const ActivityCard = ({ title, value, icon, color, trend }) => (
  <div className="bg-background rounded-xl p-4 border border-surface">
    <div className="flex items-center justify-between mb-2">
      <div className={`w-8 h-8 rounded-full bg-${color} text-white flex items-center justify-center`}>
        <Icon name={icon} />
      </div>
      <span className={`text-xs font-bold ${trend.startsWith('+') ? 'text-success' : 'text-error'}`}>
        {trend}
      </span>
    </div>
    <div className="text-lg font-bold">{value}</div>
    <div className="text-xs text-gray-500">{title}</div>
  </div>
);

export default Dashboard; 