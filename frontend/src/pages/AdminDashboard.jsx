// frontend/src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalAuditLogs: 0,
    recentLogins: 0,
  });
  const [recentAudits, setRecentAudits] = useState([]);
  const [systemInfo, setSystemInfo] = useState({
    version: '1.0.0',
    uptime: 'N/A',
    database: 'SQLite',
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [usersRes, auditsRes] = await Promise.all([
        axiosClient.get('/users/?page_size=1'),
        axiosClient.get('/audit/?page_size=10'),
      ]);

      setStats({
        totalUsers: usersRes.data.count || 0,
        activeUsers: usersRes.data.count || 0,
        totalAuditLogs: auditsRes.data.count || 0,
        recentLogins: 0,
      });

      setRecentAudits(auditsRes.data.results || []);
    } catch (error) {
      console.error('Error loading admin dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, link, color = "blue" }) => (
    <Link to={link} className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-${color}-500`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
        </div>
        <div className={`text-${color}-500 text-4xl`}>{icon}</div>
      </div>
    </Link>
  );

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="text-center py-12">
          <div className="text-gray-600">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">System administration and user management</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Users" value={stats.totalUsers} icon="👥" link="/users" color="blue" />
          <StatCard title="Active Users" value={stats.activeUsers} icon="✅" link="/users" color="green" />
          <StatCard title="Audit Logs" value={stats.totalAuditLogs} icon="📋" link="/audit" color="purple" />
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">System Health</p>
                <p className="text-2xl font-bold text-green-600 mt-2">Healthy</p>
              </div>
              <div className="text-green-500 text-4xl">✓</div>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">System Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-600">Version</span>
                <span className="font-medium text-gray-800">{systemInfo.version}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-600">Database</span>
                <span className="font-medium text-gray-800">{systemInfo.database}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-600">Framework</span>
                <span className="font-medium text-gray-800">Django + React</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Authentication</span>
                <span className="font-medium text-green-600">Azure AD</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Stats</h2>
            <div className="space-y-3">
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-600">Total Models</span>
                <span className="font-medium text-gray-800">71+</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-600">API Endpoints</span>
                <span className="font-medium text-gray-800">22+</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-600">Active Sessions</span>
                <span className="font-medium text-gray-800">{stats.totalUsers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Deploy</span>
                <span className="font-medium text-gray-800">Today</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Audit Logs */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Recent Activity</h2>
              <Link to="/audit" className="text-gseblue hover:text-gselightblue text-sm font-medium">
                View All Logs →
              </Link>
            </div>
          </div>
          <div className="p-6">
            {recentAudits.length > 0 ? (
              <div className="space-y-3">
                {recentAudits.slice(0, 8).map((audit, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        audit.action === 'CREATE' ? 'bg-green-500' :
                        audit.action === 'UPDATE' ? 'bg-blue-500' :
                        audit.action === 'DELETE' ? 'bg-red-500' :
                        'bg-gray-500'
                      }`}></div>
                      <div>
                        <div className="text-sm font-medium text-gray-800">
                          {audit.user_name || audit.user} - {audit.action}
                        </div>
                        <div className="text-xs text-gray-600">
                          {audit.model_name} • {audit.object_repr || 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(audit.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No recent activity</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Admin Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Link to="/users" className="p-4 bg-gseblue text-white rounded-lg hover:bg-gselightblue transition text-center font-medium">
              Manage Users
            </Link>
            <Link to="/audit" className="p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-center font-medium">
              View Audit Logs
            </Link>
            <button className="p-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-center font-medium">
              System Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
