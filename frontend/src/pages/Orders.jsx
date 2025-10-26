// frontend/src/pages/Orders.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filters
  const [orderTypeFilter, setOrderTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get("/orders/");
      
      // Handle both paginated and direct array responses
      const ordersList = Array.isArray(response.data) 
        ? response.data 
        : (response.data.results || []);
      
      setOrders(ordersList);
      setError("");
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  // Download pick ticket
  const handleDownloadPickTicket = async (orderId) => {
    try {
      const response = await axiosClient.get(`/orders/${orderId}/pick-ticket/`, {
        responseType: 'blob',
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `pick_ticket_${orderId.substring(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading pick ticket:", err);
      alert("Failed to download pick ticket. Please try again.");
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesType = !orderTypeFilter || order.order_type === orderTypeFilter;
    const matchesStatus = !statusFilter || order.order_status === statusFilter;
    const matchesSearch = !searchQuery || 
      order.order_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.vendor?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesType && matchesStatus && matchesSearch;
  });

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Get status badge color
  const getStatusColor = (status) => {
    const colors = {
      DRAFT: "bg-gray-200 text-gray-700",
      PENDING: "bg-yellow-200 text-yellow-800",
      APPROVED: "bg-blue-200 text-blue-800",
      COMPLETED: "bg-green-200 text-green-800",
      CANCELLED: "bg-red-200 text-red-800",
    };
    return colors[status] || "bg-gray-200 text-gray-700";
  };

  // Get order type badge color
  const getTypeColor = (type) => {
    const colors = {
      SALES: "bg-green-100 text-green-700",
      PURCHASE: "bg-blue-100 text-blue-700",
      TRANSFER: "bg-purple-100 text-purple-700",
      RMA: "bg-orange-100 text-orange-700",
      RETURN: "bg-pink-100 text-pink-700",
    };
    return colors[type] || "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="text-center py-12">
          <div className="text-gray-600">Loading orders...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <Link
          to="/orders/create"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          + Create Order
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Search</label>
            <input
              type="text"
              placeholder="Order ID, customer, vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Order Type</label>
            <select
              value={orderTypeFilter}
              onChange={(e) => setOrderTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">All Types</option>
              <option value="SALES">Sales</option>
              <option value="PURCHASE">Purchase</option>
              <option value="TRANSFER">Transfer</option>
              <option value="RMA">RMA</option>
              <option value="RETURN">Return</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-gray-500 mb-4">
            {orders.length === 0 ? "No orders yet" : "No orders match your filters"}
          </div>
          {orders.length === 0 && (
            <Link
              to="/orders/create"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Your First Order
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Order ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Customer/Vendor</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Lines</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.order_id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      to={`/orders/${order.order_id}`}
                      className="text-blue-600 hover:underline font-mono text-sm"
                    >
                      {order.order_id.substring(0, 8)}...
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(order.order_type)}`}>
                      {order.order_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.order_status)}`}>
                      {order.order_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {order.customer?.name || order.vendor?.name || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(order.ordered_at)}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    {order.line_count || 0}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/orders/${order.order_id}`}
                        className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                      >
                        View
                      </Link>
                      {order.order_type === "SALES" && (
                        <button
                          onClick={() => handleDownloadPickTicket(order.order_id)}
                          className="px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded"
                          title="Download Pick Ticket"
                        >
                          📄 Pick
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Stats */}
      {orders.length > 0 && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-gray-800">{orders.length}</div>
            <div className="text-sm text-gray-600">Total Orders</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {orders.filter(o => o.order_status === "PENDING").length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {orders.filter(o => o.order_type === "SALES").length}
            </div>
            <div className="text-sm text-gray-600">Sales</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {orders.filter(o => o.order_type === "PURCHASE").length}
            </div>
            <div className="text-sm text-gray-600">Purchase</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {orders.filter(o => o.order_type === "TRANSFER").length}
            </div>
            <div className="text-sm text-gray-600">Transfer</div>
          </div>
        </div>
      )}
    </div>
  );
}