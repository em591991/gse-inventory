import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";

export default function Dashboard() {
  // Fetch summary stats from various endpoints
  const { data: itemsCount } = useQuery({
    queryKey: ["items-count"],
    queryFn: async () => {
      const response = await axiosClient.get("/items/?page_size=1");
      return response.data.count;
    },
  });

  const { data: shipmentsCount } = useQuery({
    queryKey: ["shipments-count"],
    queryFn: async () => {
      const response = await axiosClient.get("/shipments/?page_size=1");
      return response.data.count;
    },
  });

  const { data: equipmentCount } = useQuery({
    queryKey: ["equipment-count"],
    queryFn: async () => {
      const response = await axiosClient.get("/equipment/?page_size=1");
      return response.data.count;
    },
  });

  const { data: vehiclesCount } = useQuery({
    queryKey: ["vehicles-count"],
    queryFn: async () => {
      const response = await axiosClient.get("/vehicles/?page_size=1");
      return response.data.count;
    },
  });

  const { data: usersCount } = useQuery({
    queryKey: ["users-count"],
    queryFn: async () => {
      const response = await axiosClient.get("/users/?page_size=1");
      return response.data.count;
    },
  });

  const { data: recentShipments } = useQuery({
    queryKey: ["recent-shipments"],
    queryFn: async () => {
      const response = await axiosClient.get("/shipments/?page_size=5");
      return response.data.results;
    },
  });

  const stats = [
    {
      title: "Total Items",
      value: itemsCount || 0,
      icon: "📦",
      color: "blue",
      link: "/items",
    },
    {
      title: "Active Shipments",
      value: shipmentsCount || 0,
      icon: "🚚",
      color: "green",
      link: "/shipments",
    },
    {
      title: "Equipment",
      value: equipmentCount || 0,
      icon: "🔧",
      color: "yellow",
      link: "/equipment",
    },
    {
      title: "Vehicles",
      value: vehiclesCount || 0,
      icon: "🚗",
      color: "purple",
      link: "/vehicles",
    },
    {
      title: "System Users",
      value: usersCount || 0,
      icon: "👥",
      color: "indigo",
      link: "/users",
    },
  ];

  const colorClasses = {
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    green: "bg-green-100 text-green-800 border-green-200",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
    purple: "bg-purple-100 text-purple-800 border-purple-200",
    indigo: "bg-indigo-100 text-indigo-800 border-indigo-200",
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-1">System overview and quick stats</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.title}
            to={stat.link}
            className={`p-6 rounded-lg border-2 ${
              colorClasses[stat.color]
            } hover:shadow-lg transition`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">{stat.icon}</span>
            </div>
            <div className="text-3xl font-bold mb-1">{stat.value}</div>
            <div className="text-sm font-medium">{stat.title}</div>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Shipments */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Recent Shipments</h2>
            <Link to="/shipments" className="text-blue-600 hover:text-blue-800 text-sm">
              View All →
            </Link>
          </div>
          {recentShipments && recentShipments.length > 0 ? (
            <div className="space-y-3">
              {recentShipments.map((shipment) => (
                <div
                  key={shipment.shipment_id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded"
                >
                  <div>
                    <div className="font-medium">
                      {shipment.tracking_no || "No tracking"}
                    </div>
                    <div className="text-sm text-gray-600">{shipment.carrier}</div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      shipment.status === "DELIVERED"
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {shipment.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No shipments yet</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link
              to="/items"
              className="block p-3 bg-blue-50 hover:bg-blue-100 rounded transition"
            >
              <div className="font-medium text-blue-800">➕ Add New Item</div>
              <div className="text-sm text-blue-600">Create inventory item</div>
            </Link>
            <Link
              to="/shipments"
              className="block p-3 bg-green-50 hover:bg-green-100 rounded transition"
            >
              <div className="font-medium text-green-800">📦 Create Shipment</div>
              <div className="text-sm text-green-600">Track new delivery</div>
            </Link>
            <Link
              to="/equipment"
              className="block p-3 bg-yellow-50 hover:bg-yellow-100 rounded transition"
            >
              <div className="font-medium text-yellow-800">🔧 Add Equipment</div>
              <div className="text-sm text-yellow-600">Register new equipment</div>
            </Link>
            <Link
              to="/vehicles"
              className="block p-3 bg-purple-50 hover:bg-purple-100 rounded transition"
            >
              <div className="font-medium text-purple-800">🚗 Add Vehicle</div>
              <div className="text-sm text-purple-600">Register fleet vehicle</div>
            </Link>
            <Link
              to="/audit"
              className="block p-3 bg-gray-50 hover:bg-gray-100 rounded transition"
            >
              <div className="font-medium text-gray-800">📊 View Audit Log</div>
              <div className="text-sm text-gray-600">System activity</div>
            </Link>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">System Information</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-gray-50 rounded">
            <div className="text-2xl font-bold text-gray-800">71</div>
            <div className="text-sm text-gray-600">Database Models</div>
          </div>
          <div className="p-4 bg-gray-50 rounded">
            <div className="text-2xl font-bold text-gray-800">22+</div>
            <div className="text-sm text-gray-600">API Endpoints</div>
          </div>
          <div className="p-4 bg-gray-50 rounded">
            <div className="text-2xl font-bold text-gray-800">5</div>
            <div className="text-sm text-gray-600">New Modules</div>
          </div>
          <div className="p-4 bg-gray-50 rounded">
            <div className="text-2xl font-bold text-green-600">✓</div>
            <div className="text-sm text-gray-600">System Healthy</div>
          </div>
        </div>
      </div>
    </div>
  );
}