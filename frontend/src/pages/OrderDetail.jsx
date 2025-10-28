// frontend/src/pages/OrderDetail.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { fetchOrderById, downloadPickTicket } from "../services/ordersService";

export default function OrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingTicket, setDownloadingTicket] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching order with ID:", orderId);
      const data = await fetchOrderById(orderId);
      console.log("Order data received:", data);
      setOrder(data);
    } catch (err) {
      console.error("Error loading order:", err);
      console.error("Error response:", err.response?.data);
      setError(`Failed to load order details: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPickTicket = async () => {
    try {
      setDownloadingTicket(true);
      await downloadPickTicket(orderId);
    } catch (err) {
      console.error("Error downloading pick ticket:", err);
      alert("Failed to download pick ticket. Please try again.");
    } finally {
      setDownloadingTicket(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: "bg-yellow-100 text-yellow-800",
      CONFIRMED: "bg-blue-100 text-blue-800",
      IN_PROGRESS: "bg-purple-100 text-purple-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const calculateLineTotal = (line) => {
    if (line.qty && line.price_each) {
      return (parseFloat(line.qty) * parseFloat(line.price_each)).toFixed(2);
    }
    return "0.00";
  };

  const calculateOrderTotal = () => {
    if (!order || !order.lines) return "0.00";
    const total = order.lines.reduce((sum, line) => {
      return sum + parseFloat(calculateLineTotal(line));
    }, 0);
    return total.toFixed(2);
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-4">Loading order...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-700">{error}</p>
          <div className="mt-4 space-x-3">
            <button
              onClick={loadOrder}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate("/orders")}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Back to Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <p>Order not found.</p>
        <Link to="/orders" className="text-blue-600 hover:text-blue-800">
          ← Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/orders"
          className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center"
        >
          ← Back to Orders
        </Link>
        <div className="flex justify-between items-start mt-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              Order Details
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Order ID: {order.order_id}
            </p>
          </div>
          {order.order_type === "SALES" && (
            <button
              onClick={handleDownloadPickTicket}
              disabled={downloadingTicket}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
            >
              {downloadingTicket ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Downloading...
                </>
              ) : (
                <>📄 Download Pick Ticket</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Order Info Card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Order Information</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {order.description && (
            <div className="col-span-2 md:col-span-4">
              <p className="text-sm text-gray-500">Description</p>
              <p className="font-medium">{order.description}</p>
            </div>
          )}
          {(order.order_type === "PURCHASE" || order.order_type === "RMA" ||
            order.order_type === "SALES" || order.order_type === "RETURN") && (
            <div className="col-span-2">
              <p className="text-sm text-gray-500">
                {(order.order_type === "PURCHASE" || order.order_type === "RMA") ? "Vendor" : "Job"}
              </p>
              <p className="font-medium">
                {(() => {
                  // PURCHASE or RMA: Show vendor
                  if (order.order_type === "PURCHASE" || order.order_type === "RMA") {
                    return order.vendor?.name || "N/A";
                  }
                  // SALES or RETURN: Show "Customer - Job"
                  if (order.order_type === "SALES" || order.order_type === "RETURN") {
                    if (order.customer && order.job) {
                      return `${order.customer.name} - ${order.job.name || order.job.job_code}`;
                    }
                    return order.customer?.name || "N/A";
                  }
                  return "N/A";
                })()}
              </p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500">Order Type</p>
            <p className="font-medium">{order.order_type}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <span
              className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                order.order_status
              )}`}
            >
              {order.order_status}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500">Date</p>
            <p className="font-medium">{formatDate(order.ordered_at)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Created By</p>
            <p className="font-medium">{order.created_by?.name || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">From</p>
            <p className="font-medium">{order.from_location?.name || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">To</p>
            <p className="font-medium">{order.to_location?.name || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Assigned To</p>
            <p className="font-medium">{order.assigned_user?.name || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Fulfillment Date</p>
            <p className="font-medium">{order.fulfillment_date ? formatDate(order.fulfillment_date) : "N/A"}</p>
          </div>
          {order.job && (
            <div>
              <p className="text-sm text-gray-500">Job</p>
              <p className="font-medium">{order.job?.name || order.job?.job_code || "N/A"}</p>
            </div>
          )}
          {order.department && (
            <div>
              <p className="text-sm text-gray-500">Department</p>
              <p className="font-medium">{order.department?.name || "N/A"}</p>
            </div>
          )}
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Line Items</h2>
        </div>
        {order.lines && order.lines.length > 0 ? (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Line
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    G-Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    UOM
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price Each
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {order.lines.map((line) => (
                  <tr key={line.order_line_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {line.line_no}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {line.g_code}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {line.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {line.qty}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {line.uom?.uom_code || line.uom_code || "EA"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      ${parseFloat(line.price_each).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                      ${calculateLineTotal(line)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-4 text-right text-sm font-semibold text-gray-700"
                  >
                    Total:
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                    ${calculateOrderTotal()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </>
        ) : (
          <div className="p-12 text-center text-gray-500">
            No line items for this order.
          </div>
        )}
      </div>
    </div>
  );
}