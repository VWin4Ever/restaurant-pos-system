import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import LoadingSpinner from '../common/LoadingSpinner';
import Icon from '../common/Icon';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentActivity, setRecentActivity] = useState([
    { id: 1, message: 'System is running smoothly', type: 'success', time: 'Just now' },
    { id: 2, message: 'All tables are operational', type: 'primary', time: '2 min ago' },
    { id: 3, message: 'Ready to serve customers', type: 'warning', time: '5 min ago' },
  ]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const statsRes = await axios.get('/api/reports/dashboard');
        const salesRes = await axios.get('/api/reports/sales?range=week');
        setStats(statsRes.data.data);
        setSalesData(salesRes.data.data);
      } catch (err) {
        setError('Failed to load dashboard');
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return (
    <div className="flex flex-col items-center justify-center py-16">
      <Icon name="error" className="w-16 h-16 text-error mb-4" />
      <div className="text-xl font-bold text-error mb-2">{error}</div>
      <button className="btn-primary" onClick={() => window.location.reload()}>Retry</button>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatCard title="Today's Sales" value={formatCurrency(stats.todaySales?.total || 0)} icon="money" color="primary" />
        <StatCard title="Pending Orders" value={stats.pendingOrders || 0} icon="clock" color="warning" onClick={() => navigate('/orders')} clickable />
        <StatCard title="Available Tables" value={stats.availableTables || 0} icon="tables" color="success" onClick={() => navigate('/tables')} clickable />
        <StatCard title="Avg Order" value={formatCurrency(stats.averageOrder || 0)} icon="reports" color="accent" />
      </div>

      {/* Sales Trend Chart */}
      <div className="bg-surface rounded-2xl p-6 shadow-soft">
        <h2 className="text-xl font-bold mb-4">Sales Trend (Last 7 Days)</h2>
        {salesData && salesData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="total" fill="#6B2C2F" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-40 text-gray-400 text-lg">No sales data for the last 7 days.</div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <button className="btn-primary flex items-center transition-transform hover:scale-105" onClick={() => navigate('/orders')}>
          <Icon name="add" className="mr-2" /> New Order
        </button>
        <button className="btn-accent flex items-center transition-transform hover:scale-105" onClick={() => window.print()}>
          <Icon name="download" className="mr-2" /> Print Report
        </button>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-surface rounded-2xl p-6 shadow-soft animate-fade-in-up">
        <div className="flex items-center space-x-3 mb-6">
          <div className="icon-primary">
            <Icon name="clock" />
          </div>
          <h3 className="text-xl font-bold text-gradient">Recent Activity</h3>
        </div>
        <div className="space-y-4">
          {recentActivity.map(activity => (
            <div key={activity.id} className="flex items-center space-x-3 p-3 bg-background rounded-xl border border-surface">
              <div className={`w-2 h-2 rounded-full ${activity.type === 'success' ? 'bg-success' : activity.type === 'primary' ? 'bg-primary' : 'bg-warning'}`}></div>
              <span className="text-sm text-primary">{activity.message}</span>
              <span className="text-xs text-gray-400 ml-auto">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function formatCurrency(amount) {
  if (typeof amount !== 'number') amount = Number(amount) || 0;
  return '$' + amount.toLocaleString();
}

const StatCard = ({ title, value, icon, color, onClick, clickable }) => (
  <div
    className={`card flex items-center space-x-4 p-6 cursor-${clickable ? 'pointer' : 'default'} transition hover:shadow-lg hover:-translate-y-1`}
    onClick={clickable ? onClick : undefined}
    tabIndex={clickable ? 0 : -1}
    role={clickable ? 'button' : undefined}
    aria-label={clickable ? title : undefined}
    style={clickable ? { outline: 'none' } : {}}
  >
    <div className={`rounded-full p-3 bg-${color} text-white flex items-center justify-center transition-transform duration-200`}>
      <Icon name={icon} size="xl" />
    </div>
    <div>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-sm text-gray-500">{title}</div>
    </div>
  </div>
);

export default Dashboard; 