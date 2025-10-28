// frontend/src/pages/CreateOrder.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";

export default function CreateOrder() {
  const navigate = useNavigate();

  // Form state
  const [orderType, setOrderType] = useState("SALES");
  const [customer, setCustomer] = useState("");
  const [job, setJob] = useState("");
  const [vendor, setVendor] = useState("");
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [purchaseCategory, setPurchaseCategory] = useState("MATERIAL");
  const [assignedUser, setAssignedUser] = useState("");
  const [description, setDescription] = useState("");
  const [orderLines, setOrderLines] = useState([]);

  // Dropdown data
  const [customers, setCustomers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [locations, setLocations] = useState([]);
  const [items, setItems] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [users, setUsers] = useState([]);

  // Modal state
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [itemSearch, setItemSearch] = useState("");
  const [editingLineIndex, setEditingLineIndex] = useState(null);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch dropdown data on mount
  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    try {
      const [customersRes, jobsRes, vendorsRes, locationsRes, itemsRes, uomsRes, usersRes] = await Promise.all([
        axiosClient.get("/customers/"),
        axiosClient.get("/jobs/"),
        axiosClient.get("/vendors/"),
        axiosClient.get("/locations/"),
        axiosClient.get("/items/"),
        axiosClient.get("/units/"),
        axiosClient.get("/users/users/"),
      ]);

      console.log("API Responses:", {
        customers: customersRes.data,
        jobs: jobsRes.data,
        vendors: vendorsRes.data,
        locations: locationsRes.data,
        items: itemsRes.data,
        uoms: uomsRes.data,
        users: usersRes.data,
      });

      // Handle both paginated and direct array responses
      setCustomers(Array.isArray(customersRes.data) ? customersRes.data : customersRes.data.results || []);
      setJobs(Array.isArray(jobsRes.data) ? jobsRes.data : jobsRes.data.results || []);
      setVendors(Array.isArray(vendorsRes.data) ? vendorsRes.data : vendorsRes.data.results || []);
      setLocations(Array.isArray(locationsRes.data) ? locationsRes.data : locationsRes.data.results || []);
      setItems(Array.isArray(itemsRes.data) ? itemsRes.data : itemsRes.data.results || []);
      setUoms(Array.isArray(uomsRes.data) ? uomsRes.data : uomsRes.data.results || []);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.results || []);
    } catch (err) {
      console.error("Error fetching dropdown data:", err);
      console.error("Error details:", err.response?.data);
      setError(`Failed to load form data: ${err.response?.data?.detail || err.message}. Check console for details.`);
    }
  };

  // Add order line
  const handleAddItem = () => {
    setEditingLineIndex(null);
    setShowItemPicker(true);
  };

  // Select item from modal
  const handleSelectItem = (item) => {
    const defaultUom = uoms.find(u => u.uom_code === "EA") || uoms[0];
    
    const newLine = {
      item_id: item.item_id,
      g_code: item.g_code,
      description: item.item_name,
      qty: 1,
      price_each: 0.00,
      uom_id: defaultUom?.uom_id || null,
      uom_code: defaultUom?.uom_code || "EA",
    };

    if (editingLineIndex !== null) {
      // Replace existing line
      const updated = [...orderLines];
      updated[editingLineIndex] = newLine;
      setOrderLines(updated);
    } else {
      // Add new line
      setOrderLines([...orderLines, newLine]);
    }

    setShowItemPicker(false);
    setItemSearch("");
  };

  // Remove order line
  const handleRemoveLine = (index) => {
    setOrderLines(orderLines.filter((_, i) => i !== index));
  };

  // Update line field
  const handleUpdateLine = (index, field, value) => {
    const updated = [...orderLines];
    updated[index][field] = value;
    setOrderLines(updated);
  };

  // Calculate total
  const calculateTotal = () => {
    return orderLines.reduce((sum, line) => {
      return sum + (parseFloat(line.qty) || 0) * (parseFloat(line.price_each) || 0);
    }, 0).toFixed(2);
  };

  // Submit order
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (orderLines.length === 0) {
      setError("Please add at least one order line");
      setLoading(false);
      return;
    }

    if (orderType === "SALES" && !customer) {
      setError("Please select a customer for sales orders");
      setLoading(false);
      return;
    }

    if (orderType === "PURCHASE" && !vendor) {
      setError("Please select a vendor for purchase orders");
      setLoading(false);
      return;
    }

    try {
      // Build order data with nested order lines
      const orderData = {
        order_type: orderType,
        order_status: "DRAFT",
        customer: customer || null,
        job: job || null,
        vendor: vendor || null,
        from_location: fromLocation || null,
        to_location: toLocation || null,
        assigned_user: assignedUser || null,
        description: description,
        order_lines: orderLines.map((line, index) => {
          const lineData = {
            line_no: index + 1,
            item: line.item_id,
            description: line.description,
            qty: parseFloat(line.qty),
            price_each: parseFloat(line.price_each),
            uom: line.uom_code,
            g_code: line.g_code,
          };

          // Only include purchase_category for purchase orders
          if (orderType === "PURCHASE") {
            lineData.purchase_category = purchaseCategory;
          }

          return lineData;
        }),
      };

      // Add purchase_category at order level for purchase orders
      if (orderType === "PURCHASE") {
        orderData.purchase_category = purchaseCategory;
      }

      console.log("Sending order data:", orderData);

      // Create order with nested order lines in single request
      const orderResponse = await axiosClient.post("/orders/", orderData);
      const orderId = orderResponse.data.order_id;

      // Success! Navigate to order detail
      navigate(`/orders/${orderId}`);
    } catch (err) {
      console.error("Error creating order:", err);
      console.error("Error response data:", err.response?.data);
      console.error("Error status:", err.response?.status);
      setError(`Failed to create order: ${JSON.stringify(err.response?.data) || err.message}`);
      setLoading(false);
    }
  };

  // Filter items for search
  const filteredItems = items.filter(item => {
    const search = itemSearch.toLowerCase();
    return (
      item.g_code?.toLowerCase().includes(search) ||
      item.item_name?.toLowerCase().includes(search) ||
      item.description?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Create New Order</h1>
          <button
            onClick={() => navigate("/orders")}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Order Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Order Type *</label>
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            >
              <option value="SALES">Sales Order</option>
              <option value="PURCHASE">Purchase Order</option>
              <option value="TRANSFER">Transfer Order</option>
              <option value="RMA">RMA (Return to Vendor)</option>
              <option value="RETURN">Return from Customer</option>
            </select>
          </div>

          {/* Dynamic fields based on order type */}
          <div className="grid grid-cols-2 gap-4">
            {/* Customer (for SALES, RETURN) */}
            {(orderType === "SALES" || orderType === "RETURN") && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Customer {orderType === "SALES" ? "*" : ""}
                </label>
                <select
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  required={orderType === "SALES"}
                >
                  <option value="">Select Customer</option>
                  {customers.map((c) => (
                    <option key={c.customer_id} value={c.customer_id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Job (optional for SALES) */}
            {orderType === "SALES" && (
              <div>
                <label className="block text-sm font-medium mb-2">Job (Optional)</label>
                <select
                  value={job}
                  onChange={(e) => setJob(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select Job</option>
                  {jobs.map((j) => (
                    <option key={j.job_id} value={j.job_id}>
                      {j.job_code} - {j.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Vendor (for PURCHASE, RMA) */}
            {(orderType === "PURCHASE" || orderType === "RMA") && (
              <div>
                <label className="block text-sm font-medium mb-2">Vendor *</label>
                <select
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="">Select Vendor</option>
                  {vendors.map((v) => (
                    <option key={v.vendor_id} value={v.vendor_id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Purchase Category (for PURCHASE orders) */}
            {orderType === "PURCHASE" && (
              <div>
                <label className="block text-sm font-medium mb-2">Purchase Category *</label>
                <select
                  value={purchaseCategory}
                  onChange={(e) => setPurchaseCategory(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="MATERIAL">Material</option>
                  <option value="TOOL">Tool</option>
                  <option value="EQUIPMENT">Equipment</option>
                  <option value="VEHICLE">Vehicle</option>
                  <option value="SERVICE">Service</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            )}

            {/* Assigned User/Handler (for non-PURCHASE orders) */}
            {orderType !== "PURCHASE" && (
              <div>
                <label className="block text-sm font-medium mb-2">Assign To (Optional)</label>
                <select
                  value={assignedUser}
                  onChange={(e) => setAssignedUser(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select User</option>
                  {users.map((user) => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* From Location (for TRANSFER, SALES, RMA) */}
            {(orderType === "TRANSFER" || orderType === "SALES" || orderType === "RMA") && (
              <div>
                <label className="block text-sm font-medium mb-2">From Location</label>
                <select
                  value={fromLocation}
                  onChange={(e) => setFromLocation(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select Location</option>
                  {locations.map((loc) => (
                    <option key={loc.location_id} value={loc.location_id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* To Location (for TRANSFER, PURCHASE, RETURN) */}
            {(orderType === "TRANSFER" || orderType === "PURCHASE" || orderType === "RETURN") && (
              <div>
                <label className="block text-sm font-medium mb-2">To Location</label>
                <select
                  value={toLocation}
                  onChange={(e) => setToLocation(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select Location</option>
                  {locations.map((loc) => (
                    <option key={loc.location_id} value={loc.location_id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              rows="3"
              placeholder="Describe the purpose of this order"
              required
            />
          </div>

          {/* Order Lines */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-medium">Order Lines</h2>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 shadow-md transition-colors"
              >
                + Add Item
              </button>
            </div>

            {orderLines.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                No items added yet. Click "+ Add Item" to start.
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm">G-Code</th>
                      <th className="px-4 py-2 text-left text-sm">Description</th>
                      <th className="px-4 py-2 text-left text-sm w-24">Qty</th>
                      <th className="px-4 py-2 text-left text-sm w-32">Price Each</th>
                      <th className="px-4 py-2 text-left text-sm w-24">UOM</th>
                      <th className="px-4 py-2 text-right text-sm w-32">Subtotal</th>
                      <th className="px-4 py-2 w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderLines.map((line, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-2 text-sm font-mono">{line.g_code}</td>
                        <td className="px-4 py-2 text-sm">{line.description}</td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            value={line.qty}
                            onChange={(e) => handleUpdateLine(index, "qty", e.target.value)}
                            className="w-full px-2 py-1 border rounded text-sm"
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            value={line.price_each}
                            readOnly
                            className="w-full px-2 py-1 border rounded text-sm bg-gray-100 cursor-not-allowed"
                            title="Price is auto-populated from vendor item table"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={line.uom_id || ""}
                            onChange={(e) => {
                              const selectedUom = uoms.find(u => u.uom_id === e.target.value);
                              handleUpdateLine(index, "uom_id", e.target.value);
                              handleUpdateLine(index, "uom_code", selectedUom?.uom_code || "");
                            }}
                            className="w-full px-2 py-1 border rounded text-sm"
                          >
                            {uoms.map((u) => (
                              <option key={u.uom_id} value={u.uom_id}>
                                {u.uom_code}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2 text-right text-sm font-medium">
                          ${((parseFloat(line.qty) || 0) * (parseFloat(line.price_each) || 0)).toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(index)}
                            className="text-red-600 hover:text-red-800 font-bold"
                            title="Remove line"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2">
                    <tr>
                      <td colSpan="5" className="px-4 py-3 text-right font-semibold">Total:</td>
                      <td className="px-4 py-3 text-right font-bold text-lg">${calculateTotal()}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate("/orders")}
              className="px-6 py-2 border rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 shadow-md disabled:opacity-50 transition-colors"
              disabled={loading || orderLines.length === 0}
            >
              {loading ? "Creating..." : "Create Order"}
            </button>
          </div>
        </form>
      </div>

      {/* Item Picker Modal */}
      {showItemPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Select Item</h3>
              <button
                onClick={() => {
                  setShowItemPicker(false);
                  setItemSearch("");
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b">
              <input
                type="text"
                placeholder="Search by G-Code, name, or description..."
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                autoFocus
              />
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-4">
              {filteredItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {itemSearch ? "No items found matching your search" : "No items available"}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredItems.map((item) => (
                    <button
                      key={item.item_id}
                      onClick={() => handleSelectItem(item)}
                      className="w-full text-left p-3 border rounded-md hover:bg-primary-50 hover:border-primary-300 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-semibold text-primary-600">{item.g_code}</div>
                          <div className="text-sm">{item.item_name}</div>
                          {item.description && (
                            <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                          )}
                        </div>
                        <div className="text-right text-sm text-gray-600">
                          {item.category && <div>{item.category}</div>}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}