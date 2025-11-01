import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosClient from "../api/axiosClient";

export default function Shipments() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingShipment, setEditingShipment] = useState(null);

  // Fetch shipments
  const { data, isLoading, error } = useQuery({
    queryKey: ["shipments", page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page, search });
      const response = await axiosClient.get(`/shipments/?${params}`);
      return response.data;
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (shipmentData) => {
      if (editingShipment) {
        return axiosClient.put(`/shipments/${editingShipment.shipment_id}/`, shipmentData);
      }
      return axiosClient.post("/shipments/", shipmentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["shipments"]);
      setShowForm(false);
      setEditingShipment(null);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => axiosClient.delete(`/shipments/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries(["shipments"]);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    saveMutation.mutate(data);
  };

  const handleEdit = (shipment) => {
    setEditingShipment(shipment);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this shipment?")) {
      deleteMutation.mutate(id);
    }
  };

  const statusColors = {
    PENDING: "bg-yellow-100 text-yellow-800",
    STAGED: "bg-blue-100 text-blue-800",
    PICKED_UP: "bg-green-100 text-green-800",
    IN_TRANSIT: "bg-purple-100 text-purple-800",
    DELIVERED: "bg-green-200 text-green-900",
    CANCELED: "bg-red-100 text-red-800",
  };

  if (isLoading) return <div className="p-6">Loading shipments...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error.message}</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-end items-center mb-6">
        <button
          onClick={() => {
            setShowForm(true);
            setEditingShipment(null);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + New Shipment
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search tracking number, carrier..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border rounded"
        />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingShipment ? "Edit Shipment" : "New Shipment"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Order ID</label>
                <input
                  name="order"
                  defaultValue={editingShipment?.order || ""}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tracking Number</label>
                <input
                  name="tracking_no"
                  defaultValue={editingShipment?.tracking_no || ""}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Carrier</label>
                <input
                  name="carrier"
                  defaultValue={editingShipment?.carrier || ""}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  name="status"
                  defaultValue={editingShipment?.status || "PENDING"}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="PENDING">Pending</option>
                  <option value="STAGED">Staged</option>
                  <option value="PICKED_UP">Picked Up</option>
                  <option value="IN_TRANSIT">In Transit</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELED">Canceled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ship Date</label>
                <input
                  type="date"
                  name="ship_date"
                  defaultValue={editingShipment?.ship_date || ""}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Expected Delivery</label>
                <input
                  type="date"
                  name="expected_delivery"
                  defaultValue={editingShipment?.expected_delivery || ""}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  name="notes"
                  defaultValue={editingShipment?.notes || ""}
                  className="w-full px-3 py-2 border rounded"
                  rows="3"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editingShipment ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingShipment(null);
                  }}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shipments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Tracking #</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Carrier</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Ship Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Expected Delivery</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data?.results?.map((shipment) => (
              <tr key={shipment.shipment_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{shipment.tracking_no || "—"}</td>
                <td className="px-4 py-3 text-sm">{shipment.carrier || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[shipment.status]}`}>
                    {shipment.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">{shipment.ship_date || "—"}</td>
                <td className="px-4 py-3 text-sm">{shipment.expected_delivery || "—"}</td>
                <td className="px-4 py-3 text-sm">
                  <button
                    onClick={() => handleEdit(shipment)}
                    className="text-blue-600 hover:text-blue-800 mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(shipment.shipment_id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={!data?.previous}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm text-gray-600">Page {page}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={!data?.next}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}