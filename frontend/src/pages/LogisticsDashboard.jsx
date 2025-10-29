// frontend/src/pages/LogisticsDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

export default function LogisticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalItems: 0,
    totalVendors: 0,
    activeOrders: 0,
    pendingShipments: 0,
    equipmentCount: 0,
    vehicleCount: 0,
    openRFQs: 0,
    locationCount: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentShipments, setRecentShipments] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all stats in parallel
      const [itemsRes, vendorsRes, ordersRes, shipmentsRes, equipmentRes, vehiclesRes, locationsRes] = await Promise.all([
        axiosClient.get('/items/?page_size=1'),
        axiosClient.get('/vendors/?page_size=1'),
        axiosClient.get('/orders/?page_size=5'),
        axiosClient.get('/shipments/?page_size=5'),
        axiosClient.get('/equipment/?page_size=1'),
        axiosClient.get('/vehicles/?page_size=1'),
        axiosClient.get('/locations/?page_size=1'),
      ]);

      setStats({
        totalItems: itemsRes.data.count || 0,
        totalVendors: vendorsRes.data.count || 0,
        activeOrders: ordersRes.data.count || 0,
        pendingShipments: shipmentsRes.data.count || 0,
        equipmentCount: equipmentRes.data.count || 0,
        vehicleCount: vehiclesRes.data.count || 0,
        openRFQs: 0, // Will be populated when RFQ backend is ready
        locationCount: locationsRes.data.count || 0,
      });

      setRecentOrders(ordersRes.data.results || []);
      setRecentShipments(shipmentsRes.data.results || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
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
          <h1 className="text-3xl font-bold text-gray-800">Logistics Dashboard</h1>
          <p className="text-gray-600 mt-2">Overview of inventory, orders, and logistics operations</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Items" value={stats.totalItems} icon="📦" link="/items" color="blue" />
          <StatCard title="Vendors" value={stats.totalVendors} icon="🏢" link="/vendors" color="green" />
          <StatCard title="Active Orders" value={stats.activeOrders} icon="📋" link="/orders" color="purple" />
          <StatCard title="Pending Shipments" value={stats.pendingShipments} icon="🚚" link="/shipments" color="orange" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Equipment" value={stats.equipmentCount} icon="⚙️" link="/equipment" color="red" />
          <StatCard title="Vehicles" value={stats.vehicleCount} icon="🚗" link="/vehicles" color="yellow" />
          <StatCard title="Open RFQs" value={stats.openRFQs} icon="📄" link="/rfqs" color="indigo" />
          <StatCard title="Locations" value={stats.locationCount} icon="📍" link="/locations" color="pink" />
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Recent Orders</h2>
                <Link to="/orders" className="text-gseblue hover:text-gselightblue text-sm font-medium">
                  View All →
                </Link>
              </div>
            </div>
            <div className="p-6">
              {recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {recentOrders.slice(0, 5).map((order) => (
                    <Link
                      key={order.order_id}
                      to={`/orders/${order.order_id}`}
                      className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-800">{order.order_number}</div>
                          <div className="text-sm text-gray-600">{order.order_type}</div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                          order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No recent orders</p>
              )}
            </div>
          </div>

          {/* Recent Shipments */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Recent Shipments</h2>
                <Link to="/shipments" className="text-gseblue hover:text-gselightblue text-sm font-medium">
                  View All →
                </Link>
              </div>
            </div>
            <div className="p-6">
              {recentShipments.length > 0 ? (
                <div className="space-y-4">
                  {recentShipments.slice(0, 5).map((shipment) => (
                    <div
                      key={shipment.shipment_id}
                      className="block p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-800">{shipment.tracking_number || 'N/A'}</div>
                          <div className="text-sm text-gray-600">
                            {shipment.ship_date ? new Date(shipment.ship_date).toLocaleDateString() : 'No date'}
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          shipment.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                          shipment.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {shipment.status || 'PENDING'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No recent shipments</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/orders/create" className="p-4 bg-gseblue text-white rounded-lg hover:bg-gselightblue transition text-center font-medium">
              + Create Order
            </Link>
            <Link to="/rfqs/create" className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-center font-medium">
              + Create RFQ
            </Link>
            <Link to="/items" className="p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-center font-medium">
              View Inventory
            </Link>
            <Link to="/vendors" className="p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-center font-medium">
              Manage Vendors
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
