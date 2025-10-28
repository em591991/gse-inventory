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

  // Sorting
  const [sortField, setSortField] = useState("ordered_at");
  const [sortDirection, setSortDirection] = useState("desc"); // 'asc' or 'desc'

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

  // Calculate order total
  const getOrderTotal = (order) => {
    if (!order.lines || order.lines.length === 0) return 0;
    return order.lines.reduce((sum, line) => {
      return sum + (parseFloat(line.qty || 0) * parseFloat(line.price_each || 0));
    }, 0);
  };

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter and sort orders
  const filteredAndSortedOrders = orders
    .filter(order => {
      const matchesType = !orderTypeFilter || order.order_type === orderTypeFilter;
      const matchesStatus = !statusFilter || order.order_status === statusFilter;
      const matchesSearch = !searchQuery ||
        order.order_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.vendor?.name?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesType && matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      let aVal, bVal;

      switch (sortField) {
        case "description":
          aVal = a.description || "";
          bVal = b.description || "";
          break;
        case "order_type":
          aVal = a.order_type || "";
          bVal = b.order_type || "";
          break;
        case "order_status":
          aVal = a.order_status || "";
          bVal = b.order_status || "";
          break;
        case "ordered_at":
          aVal = new Date(a.ordered_at);
          bVal = new Date(b.ordered_at);
          break;
        case "created_by":
          aVal = a.created_by?.name || "";
          bVal = b.created_by?.name || "";
          break;
        case "vendor_customer":
          aVal = a.vendor?.name || a.customer?.name || "";
          bVal = b.vendor?.name || b.customer?.name || "";
          break;
        case "from_location":
          aVal = a.from_location?.name || "";
          bVal = b.from_location?.name || "";
          break;
        case "to_location":
          aVal = a.to_location?.name || "";
          bVal = b.to_location?.name || "";
          break;
        case "assigned_user":
          aVal = a.assigned_user?.name || "";
          bVal = b.assigned_user?.name || "";
          break;
        case "fulfillment_date":
          aVal = a.fulfillment_date ? new Date(a.fulfillment_date) : new Date(0);
          bVal = b.fulfillment_date ? new Date(b.fulfillment_date) : new Date(0);
          break;
        case "value":
          aVal = getOrderTotal(a);
          bVal = getOrderTotal(b);
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
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
      DRAFT: "bg-orange-100 text-orange-700 border border-orange-300",
      PENDING: "bg-yellow-100 text-yellow-700 border border-yellow-300",
      APPROVED: "bg-primary-100 text-primary-700 border border-primary-300",
      COMPLETED: "bg-emerald-100 text-emerald-700 border border-emerald-300",
      CANCELLED: "bg-red-100 text-red-700 border border-red-300",
    };
    return colors[status] || "bg-gray-100 text-gray-700 border border-gray-300";
  };

  // Get order type badge color
  const getTypeColor = (type) => {
    const colors = {
      SALES: "bg-emerald-100 text-emerald-700 border border-emerald-300",
      PURCHASE: "bg-blue-100 text-blue-700 border border-blue-300",
      TRANSFER: "bg-purple-100 text-purple-700 border border-purple-300",
      RMA: "bg-orange-100 text-orange-700 border border-orange-300",
      RETURN: "bg-gray-100 text-gray-700 border border-gray-300",
      ADJUSTMENT: "bg-yellow-100 text-yellow-700 border border-yellow-300",
    };
    return colors[type] || "bg-gray-100 text-gray-700 border border-gray-300";
  };

  // Get destination for order
  const getDestination = (order) => {
    if (order.order_type === "SALES") {
      return order.job?.name || order.customer?.name || "-";
    } else if (order.order_type === "PURCHASE") {
      return order.to_location?.name || "-";
    } else if (order.order_type === "TRANSFER") {
      return order.to_location?.name || "-";
    } else if (order.order_type === "RETURN") {
      return order.to_location?.name || "-";
    } else if (order.order_type === "RMA") {
      return order.vendor?.name || "-";
    }
    return "-";
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
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <option value="RETURN">Return</option>
              <option value="RMA">RMA</option>
              <option value="ADJUSTMENT">Adjustment</option>
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
          <div className="flex items-end justify-end">
            <Link
              to="/orders/create"
              className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 shadow-md transition-colors whitespace-nowrap"
            >
              + Create Order
            </Link>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {filteredAndSortedOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-gray-500 mb-4">
            {orders.length === 0 ? "No orders yet" : "No orders match your filters"}
          </div>
          {orders.length === 0 && (
            <Link
              to="/orders/create"
              className="inline-block px-6 py-3 bg-primary text-white rounded-md hover:bg-primary-600"
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
                <th
                  onClick={() => handleSort("description")}
                  className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-gray-200 select-none"
                >
                  Description {sortField === "description" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => handleSort("vendor_customer")}
                  className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-gray-200 select-none"
                >
                  Vendor/Job {sortField === "vendor_customer" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => handleSort("order_type")}
                  className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-gray-200 select-none"
                >
                  Type {sortField === "order_type" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => handleSort("order_status")}
                  className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-gray-200 select-none"
                >
                  Status {sortField === "order_status" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => handleSort("ordered_at")}
                  className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-gray-200 select-none"
                >
                  Date {sortField === "ordered_at" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => handleSort("created_by")}
                  className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-gray-200 select-none"
                >
                  Created By {sortField === "created_by" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => handleSort("from_location")}
                  className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-gray-200 select-none"
                >
                  From {sortField === "from_location" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => handleSort("to_location")}
                  className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-gray-200 select-none"
                >
                  To {sortField === "to_location" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => handleSort("assigned_user")}
                  className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-gray-200 select-none"
                >
                  Assigned To {sortField === "assigned_user" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => handleSort("fulfillment_date")}
                  className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-gray-200 select-none"
                >
                  Fulfillment Date {sortField === "fulfillment_date" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => handleSort("value")}
                  className="px-4 py-3 text-right text-sm font-medium cursor-pointer hover:bg-gray-200 select-none"
                >
                  Value {sortField === "value" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedOrders.map((order) => (
                <tr key={order.order_id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm max-w-xs truncate" title={order.description}>
                    {order.description || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {(() => {
                      // PURCHASE or RMA: Show vendor
                      if (order.order_type === "PURCHASE" || order.order_type === "RMA") {
                        return order.vendor?.name || "-";
                      }
                      // SALES or RETURN: Show "Customer - Job"
                      if (order.order_type === "SALES" || order.order_type === "RETURN") {
                        if (order.customer && order.job) {
                          return `${order.customer.name} - ${order.job.name || order.job.job_code}`;
                        }
                        return order.customer?.name || "-";
                      }
                      // ADJUSTMENT or TRANSFER: Show nothing
                      return "-";
                    })()}
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
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(order.ordered_at)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {order.created_by?.name || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {order.from_location?.name || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {order.to_location?.name || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {order.assigned_user?.name || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {order.fulfillment_date ? formatDate(order.fulfillment_date) : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium">
                    ${getOrderTotal(order).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/orders/${order.order_id}`}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors"
                      >
                        View
                      </Link>
                      {order.order_type === "SALES" && (
                        <button
                          onClick={() => handleDownloadPickTicket(order.order_id)}
                          className="px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-sm transition-colors"
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

    </div>
  );
}